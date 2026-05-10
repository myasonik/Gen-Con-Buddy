import React, { useState, useId } from "react";
import { GripVertical, ChevronUp, ChevronDown, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Combobox } from "@base-ui/react/combobox";
import { Drawer } from "../../ui/Drawer/Drawer";
import { Button } from "../../ui/Button/Button";
import { COLUMNS } from "./columns";
import { addSort, removeSort, setSortDir, reorderSort } from "../../utils/sortManipulation";
import type { SortState } from "../../utils/types";
import { announce } from "../../lib/announce";
import styles from "./SortDrawer.module.css";

interface SortDrawerProps {
  activeSort: SortState[];
  onSort: (sorts: SortState[]) => void;
  columnVisibility: Record<string, boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getSortFieldLabel(sortField: string): string {
  const col = COLUMNS.find((c) => c.meta?.sortField === sortField);
  return typeof col?.header === "string" ? col.header : sortField;
}

interface SortableItemProps {
  sort: SortState;
  isFirst: boolean;
  isLast: boolean;
  onUp: () => void;
  onDown: () => void;
  onToggleDir: () => void;
  onRemove: () => void;
}

function SortableItem({
  sort,
  isFirst,
  isLast,
  onUp,
  onDown,
  onToggleDir,
  onRemove,
}: SortableItemProps): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: sort.field,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const label = getSortFieldLabel(sort.field);

  return (
    <li ref={setNodeRef} style={style} className={styles.sortItem}>
      <button
        type="button"
        className={styles.dragHandle}
        aria-label={`Drag ${label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onUp}
        disabled={isFirst}
        aria-label={`Move ${label} up`}
      >
        <ChevronUp size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onDown}
        disabled={isLast}
        aria-label={`Move ${label} down`}
      >
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      <span className={styles.fieldName}>{label}</span>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onToggleDir}
        aria-label={`${label}: ${sort.dir === "asc" ? "ascending" : "descending"}, click to toggle`}
      >
        {sort.dir === "asc" ? "Asc" : "Desc"}
      </button>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onRemove}
        aria-label={`Remove ${label} sort`}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </li>
  );
}

export function SortDrawer({
  activeSort,
  onSort,
  columnVisibility,
  open,
  onOpenChange,
}: SortDrawerProps): React.JSX.Element {
  const [comboValue, setComboValue] = useState<string | null>(null);
  const [comboOpen, setComboOpen] = useState(false);
  const inputId = useId();

  const sortedFields = new Set(activeSort.map((s) => s.field));

  // Build combobox options, deduplicated by sortField (Day and Start both use startDateTime)
  const seenSortFields = new Set<string>();
  const allOptions = COLUMNS.filter((c) => {
    if (!c.id || !c.meta?.sortField) {
      return false;
    }
    if (sortedFields.has(c.meta.sortField)) {
      return false;
    }
    if (seenSortFields.has(c.meta.sortField)) {
      return false;
    }
    seenSortFields.add(c.meta.sortField);
    return true;
  }).map((c) => ({
    value: c.meta?.sortField ?? "",
    label: typeof c.header === "string" ? c.header : (c.id ?? ""),
    visible: columnVisibility[c.id ?? ""] !== false,
  }));

  const visibleOptions = allOptions.filter((o) => o.visible);
  const hiddenOptions = allOptions
    .filter((o) => !o.visible)
    .sort((a, b) => a.label.localeCompare(b.label));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const fromIndex = activeSort.findIndex((s) => s.field === active.id);
      const toIndex = activeSort.findIndex((s) => s.field === over.id);
      if (fromIndex !== -1 && toIndex !== -1) {
        const label = getSortFieldLabel(String(active.id));
        onSort(reorderSort(activeSort, fromIndex, toIndex));
        announce(`${label} moved to position ${toIndex + 1}`);
      }
    }
  }

  const triggerLabel = activeSort.length > 0 ? `Sort · ${activeSort.length}` : "Sort";

  return (
    <Drawer
      trigger={
        <Button type="button" variant="secondary">
          {triggerLabel}
        </Button>
      }
      title="Sort"
      open={open}
      onOpenChange={onOpenChange}
      footer={
        activeSort.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onSort([]);
              announce("Sort cleared");
            }}
          >
            Clear sorting
          </Button>
        ) : undefined
      }
    >
      <div className={styles.drawerBody}>
        <Combobox.Root<string>
          value={comboValue}
          open={comboOpen}
          onOpenChange={(isOpen) => setComboOpen(isOpen)}
          onValueChange={(value) => {
            if (value) {
              const label = getSortFieldLabel(value);
              onSort(addSort(activeSort, value));
              announce(`Sorting by ${label}, ascending`);
              setComboValue(null);
            }
          }}
        >
          <label htmlFor={inputId}>Pick fields to sort by</label>
          <Combobox.InputGroup>
            <Combobox.Input id={inputId} placeholder="Search fields…" />
            <Combobox.Trigger tabIndex={-1} aria-label="Toggle field list">
              <ChevronDown size={14} aria-hidden="true" />
            </Combobox.Trigger>
          </Combobox.InputGroup>
          <Combobox.Status className="sr-only" />
          {comboOpen && (
            <Combobox.Portal>
              <Combobox.Positioner sideOffset={4}>
                <div>
                  <Combobox.List>
                    {visibleOptions.length > 0 && (
                      <Combobox.Group>
                        <Combobox.GroupLabel>Visible columns</Combobox.GroupLabel>
                        {visibleOptions.map((opt) => (
                          <Combobox.Item key={opt.value} value={opt.value}>
                            {opt.label}
                          </Combobox.Item>
                        ))}
                      </Combobox.Group>
                    )}
                    {hiddenOptions.length > 0 && (
                      <Combobox.Group>
                        <Combobox.GroupLabel>Other fields</Combobox.GroupLabel>
                        {hiddenOptions.map((opt) => (
                          <Combobox.Item key={opt.value} value={opt.value}>
                            {opt.label}
                          </Combobox.Item>
                        ))}
                      </Combobox.Group>
                    )}
                    {visibleOptions.length === 0 && hiddenOptions.length === 0 && (
                      <div>No fields available</div>
                    )}
                  </Combobox.List>
                </div>
              </Combobox.Positioner>
            </Combobox.Portal>
          )}
        </Combobox.Root>

        {activeSort.length === 0 ? (
          <p className={styles.emptyState}>No fields sorted</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeSort.map((s) => s.field)}
              strategy={verticalListSortingStrategy}
            >
              <ul className={styles.sortList}>
                {activeSort.map((sort, index) => (
                  <SortableItem
                    key={sort.field}
                    sort={sort}
                    isFirst={index === 0}
                    isLast={index === activeSort.length - 1}
                    onUp={() => {
                      const newIndex = index - 1;
                      const label = getSortFieldLabel(sort.field);
                      onSort(reorderSort(activeSort, index, newIndex));
                      announce(`${label} moved to position ${newIndex + 1}`);
                    }}
                    onDown={() => {
                      const newIndex = index + 1;
                      const label = getSortFieldLabel(sort.field);
                      onSort(reorderSort(activeSort, index, newIndex));
                      announce(`${label} moved to position ${newIndex + 1}`);
                    }}
                    onToggleDir={() => {
                      const newDir = sort.dir === "asc" ? "desc" : "asc";
                      const label = getSortFieldLabel(sort.field);
                      onSort(setSortDir(activeSort, sort.field, newDir));
                      announce(
                        `${label} sort direction: ${newDir === "asc" ? "ascending" : "descending"}`,
                      );
                    }}
                    onRemove={() => {
                      const label = getSortFieldLabel(sort.field);
                      onSort(removeSort(activeSort, sort.field));
                      announce(`${label} sort removed`);
                    }}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </Drawer>
  );
}
