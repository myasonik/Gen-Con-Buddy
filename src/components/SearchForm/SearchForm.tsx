import React from "react";
import { useForm } from "react-hook-form";
import { Search, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { AGE_GROUPS, CATEGORY, EXP, REGISTRATION, YES_NO } from "../../utils/enums";
import type { SearchFormValues } from "../../utils/types";
import { Button } from "../../ui/Button/Button";
import { EventTypeSelect } from "../../ui/EventTypeSelect/EventTypeSelect";
import { Select } from "../../ui/Select/Select";
import { Field, RangeField } from "../../ui/Field/Field";
import { decodeDays, encodeDays } from "../../utils/searchParams";
import { Checkbox } from "../../ui/Checkbox/Checkbox";
import styles from "./SearchForm.module.css";

const EMPTY_VALUES: SearchFormValues = {
  filter: "",
  gameId: "",
  title: "",
  eventType: "",
  group: "",
  shortDescription: "",
  longDescription: "",
  gameSystem: "",
  rulesEdition: "",
  minPlayersMin: "",
  minPlayersMax: "",
  maxPlayersMin: "",
  maxPlayersMax: "",
  ageRequired: "",
  experienceRequired: "",
  materialsProvided: "",
  materialsRequired: "",
  materialsRequiredDetails: "",
  durationMin: "",
  durationMax: "",
  gmNames: "",
  website: "",
  email: "",
  tournament: "",
  roundNumberMin: "",
  roundNumberMax: "",
  totalRoundsMin: "",
  totalRoundsMax: "",
  minimumPlayTimeMin: "",
  minimumPlayTimeMax: "",
  attendeeRegistration: "",
  costMin: "",
  costMax: "",
  location: "",
  roomName: "",
  tableNumber: "",
  specialCategory: "",
  ticketsAvailableMin: "",
  ticketsAvailableMax: "",
  lastModifiedStart: "",
  lastModifiedEnd: "",
  days: "",
  timeStart: "",
  timeEnd: "",
};

const DAY_KEYS = ["wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<string, string> = {
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

interface SearchFormProps {
  values: SearchFormValues;
  onSearch: (values: SearchFormValues) => void;
}

export function SearchForm({ values, onSearch }: SearchFormProps): React.JSX.Element {
  const { register, handleSubmit, reset, watch, setValue } = useForm<SearchFormValues>({
    values,
  });

  const days = watch("days") ?? "";
  const eventType = watch("eventType") ?? "";

  return (
    <Dialog.Root>
      <form id="search-form" onSubmit={handleSubmit(onSearch)} className={styles.formRoot}>
        {/* Primary filter strip */}
        <div className={styles.strip}>
          {/* Keyword search */}
          <div className={styles.searchField}>
            <label htmlFor="strip-keyword" className={styles.stripLabel}>
              Search
            </label>
            <div className={styles.searchGroup}>
              <Search size={15} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="text"
                id="strip-keyword"
                className={styles.searchInput}
                placeholder="Search events…"
                {...register("filter")}
              />
            </div>
          </div>

          {/* Event type */}
          <div className={styles.eventTypeWrap}>
            <EventTypeSelect value={eventType} onValueChange={(v) => setValue("eventType", v)} />
          </div>

          {/* Day toggles + Time range + actions grouped so they share line 2 at narrow widths */}
          <div className={styles.dayTimeRow}>
            <div className={styles.dayField}>
              <span aria-hidden="true" className={styles.stripLabel}>
                Days
              </span>
              <div className={styles.dayToggles} role="group" aria-label="Days">
                {DAY_KEYS.map((key) => {
                  const selected = decodeDays(days).includes(key);
                  return (
                    <div className={styles.dayToggleWrapper} key={key}>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) => {
                          const current = decodeDays(days);
                          const next = checked
                            ? DAY_KEYS.filter((d) => current.includes(d) || d === key)
                            : current.filter((d) => d !== key);
                          setValue("days", encodeDays(next));
                        }}
                        label={DAY_LABELS[key]}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time range */}
            <div className={styles.timeField}>
              <span aria-hidden="true" className={styles.stripLabel}>
                Time
              </span>
              <div className={styles.timeRange} role="group" aria-label="Time range">
                <input
                  type="time"
                  step="1800"
                  aria-label="From"
                  className={styles.timeInput}
                  {...register("timeStart")}
                />
                <span className={styles.timeSep} aria-hidden="true">
                  –
                </span>
                <input
                  type="time"
                  step="1800"
                  aria-label="To"
                  className={styles.timeInput}
                  {...register("timeEnd")}
                />
              </div>
            </div>

            {/* Strip actions — inside dayTimeRow so they share line 2 at narrow widths;
                at desktop dayTimeRow is display:contents so this becomes a strip-level flex item */}
            <div className={styles.stripActions}>
              <Dialog.Trigger
                render={
                  <Button type="button" variant="secondary" className={styles.filtersButton}>
                    <SlidersHorizontal size={14} aria-hidden="true" /> Filters
                  </Button>
                }
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => reset(EMPTY_VALUES)}
                className={styles.resetButton}
              >
                <RotateCcw size={14} aria-hidden="true" /> Reset
              </Button>
              <Button type="submit" variant="primary" className={styles.searchButton}>
                <Search size={14} aria-hidden="true" /> Search
              </Button>
            </div>
          </div>
        </div>
      </form>

      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} data-testid="drawer-backdrop" />
        <Dialog.Popup className={styles.drawer}>
          <div className={styles.drawerHeader}>
            <Dialog.Title className={styles.drawerTitle}>Advanced Filters</Dialog.Title>
            <Dialog.Close
              render={
                <Button type="button" variant="ghost" icon aria-label="Close advanced filters">
                  <X size={16} aria-hidden="true" />
                </Button>
              }
            />
          </div>

          <div className={styles.drawerScroll}>
            {/* DURATION */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Duration</legend>
              <div className={styles.fieldsetBody}>
                <RangeField label="Duration (hours)">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={styles.input}
                    {...register("durationMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className={styles.input}
                    {...register("durationMax")}
                  />
                </RangeField>
              </div>
            </fieldset>

            {/* PLAYERS */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Players</legend>
              <div className={styles.fieldsetBody}>
                <RangeField label="Min Players">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("minPlayersMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("minPlayersMax")}
                  />
                </RangeField>
                <RangeField label="Max Players">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("maxPlayersMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("maxPlayersMax")}
                  />
                </RangeField>
                <label className={styles.label}>
                  Age Required
                  <Select
                    value={watch("ageRequired") ?? ""}
                    onValueChange={(v) => setValue("ageRequired", v)}
                    options={Object.entries(AGE_GROUPS).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </label>
                <label className={styles.label}>
                  Experience Required
                  <Select
                    value={watch("experienceRequired") ?? ""}
                    onValueChange={(v) => setValue("experienceRequired", v)}
                    options={Object.entries(EXP).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </label>
              </div>
            </fieldset>

            {/* LOGISTICS */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Logistics</legend>
              <div className={styles.fieldsetBody}>
                <Field label="Location">
                  <input type="text" className={styles.input} {...register("location")} />
                </Field>
                <Field label="Room Name">
                  <input type="text" className={styles.input} {...register("roomName")} />
                </Field>
                <Field label="Table">
                  <input type="text" className={styles.input} {...register("tableNumber")} />
                </Field>
                <RangeField label="Cost">
                  <input type="number" min="0" className={styles.input} {...register("costMin")} />
                  <input type="number" min="0" className={styles.input} {...register("costMax")} />
                </RangeField>
                <RangeField label="Tickets Available">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("ticketsAvailableMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("ticketsAvailableMax")}
                  />
                </RangeField>
                <label className={styles.label}>
                  Attendee Registration
                  <Select
                    value={watch("attendeeRegistration") ?? ""}
                    onValueChange={(v) => setValue("attendeeRegistration", v)}
                    options={Object.entries(REGISTRATION).map(([k, v]) => ({
                      value: k,
                      label: v,
                    }))}
                  />
                </label>
              </div>
            </fieldset>

            {/* DETAILS */}
            <fieldset className={styles.fieldset}>
              <legend className={styles.legend}>Details</legend>
              <div className={styles.fieldsetBody}>
                <Field label="Game ID">
                  <input type="text" className={styles.input} {...register("gameId")} />
                </Field>
                <Field label="Title">
                  <input type="text" className={styles.input} {...register("title")} />
                </Field>
                <Field label="Group">
                  <input type="text" className={styles.input} {...register("group")} />
                </Field>
                <Field label="Short Description">
                  <input type="text" className={styles.input} {...register("shortDescription")} />
                </Field>
                <Field label="Long Description">
                  <input type="text" className={styles.input} {...register("longDescription")} />
                </Field>
                <Field label="Game System">
                  <input type="text" className={styles.input} {...register("gameSystem")} />
                </Field>
                <Field label="Rules Edition">
                  <input type="text" className={styles.input} {...register("rulesEdition")} />
                </Field>
                <Field label="Materials Provided">
                  <input type="text" className={styles.input} {...register("materialsProvided")} />
                </Field>
                <label className={styles.label}>
                  Materials Required
                  <Select
                    value={watch("materialsRequired") ?? ""}
                    onValueChange={(v) => setValue("materialsRequired", v)}
                    options={Object.entries(YES_NO).map(([k, v]) => ({ value: k, label: v }))}
                    aria-label="Materials Required"
                  />
                </label>
                <Field label="Materials Required Details">
                  <input
                    type="text"
                    className={styles.input}
                    {...register("materialsRequiredDetails")}
                  />
                </Field>
                <Field label="Game Masters">
                  <input type="text" className={styles.input} {...register("gmNames")} />
                </Field>
                <Field label="Website">
                  <input type="text" className={styles.input} {...register("website")} />
                </Field>
                <Field label="Email">
                  <input type="text" className={styles.input} {...register("email")} />
                </Field>
                <label className={styles.label}>
                  Tournament
                  <Select
                    value={watch("tournament") ?? ""}
                    onValueChange={(v) => setValue("tournament", v)}
                    options={Object.entries(YES_NO).map(([k, v]) => ({ value: k, label: v }))}
                    aria-label="Tournament"
                  />
                </label>
                <RangeField label="Round Number">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("roundNumberMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("roundNumberMax")}
                  />
                </RangeField>
                <RangeField label="Total Rounds">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("totalRoundsMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("totalRoundsMax")}
                  />
                </RangeField>
                <RangeField label="Minimum Play Time">
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("minimumPlayTimeMin")}
                  />
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    {...register("minimumPlayTimeMax")}
                  />
                </RangeField>
                <label className={styles.label}>
                  Special Category
                  <Select
                    value={watch("specialCategory") ?? ""}
                    onValueChange={(v) => setValue("specialCategory", v)}
                    options={Object.entries(CATEGORY).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </label>
                <RangeField label="Last Modified" stack>
                  <input
                    type="datetime-local"
                    className={styles.input}
                    {...register("lastModifiedStart")}
                  />
                  <input
                    type="datetime-local"
                    className={styles.input}
                    {...register("lastModifiedEnd")}
                  />
                </RangeField>
              </div>
            </fieldset>
          </div>

          <div className={styles.drawerFooter}>
            <Dialog.Close
              render={
                <Button
                  type="submit"
                  form="search-form"
                  variant="primary"
                  className={styles.applyButton}
                >
                  Apply Filters
                </Button>
              }
            />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
