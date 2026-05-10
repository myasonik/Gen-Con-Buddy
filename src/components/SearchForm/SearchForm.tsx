import React from "react";
import { usePostHog } from "posthog-js/react";
import { useForm } from "react-hook-form";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { AGE_GROUPS, CATEGORY, EXP, REGISTRATION, YES_NO } from "../../utils/enums";
import type { SearchFormValues } from "../../utils/types";
import { Button } from "../../ui/Button/Button";
import { Drawer } from "../../ui/Drawer/Drawer";
import { EventTypeSelect } from "../EventTypeSelect/EventTypeSelect";
import { GameSystemSelect } from "../GameSystemSelect/GameSystemSelect";
import { Select } from "../../ui/Select/Select";
import { Field, RangeField } from "../../ui/Field/Field";
import { decodeDays, encodeDays } from "../../utils/searchParams";
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
  changelogMode?: boolean;
}

export function SearchForm({
  values,
  onSearch,
  changelogMode,
}: SearchFormProps): React.JSX.Element {
  const posthog = usePostHog();
  const { register, handleSubmit, reset, watch, setValue } = useForm<SearchFormValues>({
    values,
  });

  const days = watch("days") ?? "";
  const eventType = watch("eventType") ?? "";

  const handleSearchSubmit = (formValues: SearchFormValues): void => {
    posthog.capture("search_submitted", {
      has_keyword: Boolean(formValues.filter),
      event_type: formValues.eventType || null,
      days: formValues.days || null,
      time_start: formValues.timeStart || null,
      time_end: formValues.timeEnd || null,
    });
    onSearch(formValues);
  };

  const handleReset = (): void => {
    posthog.capture("search_filters_reset");
    reset(EMPTY_VALUES);
  };

  return (
    <div className={styles.formRoot}>
      <form id="search-form" onSubmit={handleSubmit(handleSearchSubmit)}>
        <div className={styles.strip}>
          {!changelogMode && (
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
          )}

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
                      <input
                        type="checkbox"
                        id={`day-${key}`}
                        className="sr-only"
                        checked={selected}
                        onChange={(e) => {
                          const current = decodeDays(days);
                          const next = e.target.checked
                            ? DAY_KEYS.filter((d) => current.includes(d) || d === key)
                            : current.filter((d) => d !== key);
                          setValue("days", encodeDays(next));
                        }}
                      />
                      <label htmlFor={`day-${key}`} className={styles.dayToggle}>
                        {DAY_LABELS[key]}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

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
              {!changelogMode && (
                <Drawer
                  trigger={
                    <Button type="button" variant="secondary" className={styles.filtersButton}>
                      <SlidersHorizontal size={14} aria-hidden="true" /> Filters
                    </Button>
                  }
                  title="Advanced Filters"
                  side="right"
                  footer={
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
                  }
                >
                  <div className={styles.section}>
                    <h3 className={styles.sectionHeading}>Session</h3>
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
                          options={Object.entries(AGE_GROUPS).map(([k, v]) => ({
                            value: k,
                            label: v,
                          }))}
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
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionHeading}>Logistics</h3>
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
                        <input
                          type="number"
                          min="0"
                          className={styles.input}
                          {...register("costMin")}
                        />
                        <input
                          type="number"
                          min="0"
                          className={styles.input}
                          {...register("costMax")}
                        />
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
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionHeading}>Game</h3>
                    <div className={styles.fieldsetBody}>
                      <GameSystemSelect
                        value={watch("gameSystem") ?? ""}
                        onValueChange={(v) => setValue("gameSystem", v)}
                      />
                      <Field label="Rules Edition">
                        <input type="text" className={styles.input} {...register("rulesEdition")} />
                      </Field>
                      <label className={styles.label}>
                        Special Category
                        <Select
                          value={watch("specialCategory") ?? ""}
                          onValueChange={(v) => setValue("specialCategory", v)}
                          options={Object.entries(CATEGORY).map(([k, v]) => ({
                            value: k,
                            label: v,
                          }))}
                        />
                      </label>
                      <Field label="Materials Provided">
                        <input
                          type="text"
                          className={styles.input}
                          {...register("materialsProvided")}
                        />
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
                    </div>
                  </div>

                  <div className={styles.section}>
                    <h3 className={styles.sectionHeading}>Details</h3>
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
                        <input
                          type="text"
                          className={styles.input}
                          {...register("shortDescription")}
                        />
                      </Field>
                      <Field label="Long Description">
                        <input
                          type="text"
                          className={styles.input}
                          {...register("longDescription")}
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
                  </div>
                </Drawer>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
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
    </div>
  );
}
