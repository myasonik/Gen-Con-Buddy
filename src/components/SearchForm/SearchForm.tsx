import { useForm } from "react-hook-form";
import { AGE_GROUPS, CATEGORY, EXP, REGISTRATION, YES_NO } from "../../utils/enums";
import type { SearchFormValues } from "../../utils/types";
import { Button } from "../../ui/Button/Button";
import { Toggletip } from "../../ui/Toggletip/Toggletip";
import { EventTypeSelect } from "../../ui/EventTypeSelect/EventTypeSelect";
import { Select } from "../../ui/Select/Select";
import { Field, RangeField } from "../../ui/Field/Field";
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
  startDateTimeStart: "",
  startDateTimeEnd: "",
  durationMin: "",
  durationMax: "",
  endDateTimeStart: "",
  endDateTimeEnd: "",
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

export function SearchForm({ values, onSearch }: SearchFormProps): JSX.Element {
  const { register, handleSubmit, reset, watch, setValue } = useForm<SearchFormValues>({
    values,
  });

  const days = watch("days") ?? "";
  const eventType = watch("eventType") ?? "";

  const startDateTimeStart = watch("startDateTimeStart") ?? "";
  const startDateTimeEnd = watch("startDateTimeEnd") ?? "";
  const startDateActive = Boolean(startDateTimeStart || startDateTimeEnd);
  const daysActive = Boolean(days && days.length > 0);
  const daysDisabled = startDateActive;
  const startDateDisabled = daysActive;

  return (
    <form onSubmit={handleSubmit(onSearch)} className={styles.form}>
      <div className={styles.filterScroll}>
        {/* SEARCH */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>SEARCH</legend>
          <div className={styles.fieldsetBody}>
            <Field label="Search">
              <input type="text" className={styles.input} {...register("filter")} />
            </Field>
            <EventTypeSelect value={eventType} onValueChange={(v) => setValue("eventType", v)} />
          </div>
        </fieldset>

        {/* DAYS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>DAYS</legend>
          <div className={styles.fieldsetBody}>
            {daysDisabled && (
              <Toggletip
                label="Why are day filters disabled?"
                message="Clear the Start Date fields in the TIME section to enable the day checkboxes."
              />
            )}
            <div className={styles.dayTiles}>
              {DAY_KEYS.map((key) => (
                <label key={key} className={styles.dayLabel}>
                  <input
                    type="checkbox"
                    checked={(days ?? "").split(",").includes(key)}
                    onChange={(e) => {
                      const current = days ? days.split(",") : [];
                      const next = e.target.checked
                        ? DAY_KEYS.filter((d) => current.includes(d) || d === key)
                        : current.filter((d) => d !== key);
                      setValue("days", next.join(","));
                    }}
                    disabled={daysDisabled}
                  />
                  {DAY_LABELS[key]}
                </label>
              ))}
            </div>
          </div>
        </fieldset>

        {/* TIME */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>TIME</legend>
          <div className={styles.fieldsetBody}>
            <>
              {startDateDisabled && (
                <Toggletip
                  label="Why are Start Date fields disabled?"
                  message="Clear the day checkboxes in the DAYS section to enable custom Start Date fields."
                />
              )}
              <RangeField label="Start Date" stack>
                <input
                  type="datetime-local"
                  className={styles.input}
                  disabled={startDateDisabled}
                  {...register("startDateTimeStart")}
                />
                <input
                  type="datetime-local"
                  className={styles.input}
                  disabled={startDateDisabled}
                  {...register("startDateTimeEnd")}
                />
              </RangeField>
            </>
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
            <>
              {startDateDisabled && (
                <Toggletip
                  label="Why are End Date fields disabled?"
                  message="Clear the day checkboxes in the DAYS section to enable custom End Date fields."
                />
              )}
              <RangeField label="End Date" stack>
                <input
                  type="datetime-local"
                  className={styles.input}
                  disabled={startDateDisabled}
                  {...register("endDateTimeStart")}
                />
                <input
                  type="datetime-local"
                  className={styles.input}
                  disabled={startDateDisabled}
                  {...register("endDateTimeEnd")}
                />
              </RangeField>
            </>
          </div>
        </fieldset>

        {/* PLAYERS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>PLAYERS</legend>
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
          <legend className={styles.legend}>LOGISTICS</legend>
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
                options={Object.entries(REGISTRATION).map(([k, v]) => ({ value: k, label: v }))}
              />
            </label>
          </div>
        </fieldset>

        {/* DETAILS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>DETAILS</legend>
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
      {/* end filterScroll */}

      <div className={styles.buttonBar}>
        <Button type="submit" variant="primary" className={styles.actionButton}>
          ▶ Search
        </Button>
        <Button
          variant="secondary"
          className={styles.actionButton}
          onClick={() => reset(EMPTY_VALUES)}
        >
          ↺ Reset
        </Button>
      </div>
    </form>
  );
}
