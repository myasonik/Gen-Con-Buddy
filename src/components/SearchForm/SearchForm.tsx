import { useForm } from "react-hook-form";
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from "../../utils/enums";
import type { SearchFormValues } from "../../utils/types";
import { Button } from "../../ui/Button/Button";
import { Toggletip } from "../../ui/Toggletip/Toggletip";
import { ToggleTile, ToggleTileGroup } from "../../ui/ToggleTile/ToggleTile";
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
  defaultValues: SearchFormValues;
  onSearch: (values: SearchFormValues) => void;
}

export function SearchForm({ defaultValues, onSearch }: SearchFormProps) {
  const { register, handleSubmit, reset, watch, setValue } =
    useForm<SearchFormValues>({ defaultValues });

  const days = watch("days") ?? "";

  const startDateTimeStart = watch("startDateTimeStart") ?? "";
  const startDateTimeEnd = watch("startDateTimeEnd") ?? "";
  const startDateActive = !!(startDateTimeStart || startDateTimeEnd);
  const daysActive = !!(days && days.length > 0);
  const daysDisabled = startDateActive;
  const startDateDisabled = daysActive;

  return (
    <form onSubmit={handleSubmit(onSearch)} className={styles.form}>
      <div className={styles.filterScroll}>
        {/* SEARCH */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>SEARCH</legend>
          <label className={styles.label}>
            Search
            <input
              type="text"
              className={styles.input}
              {...register("filter")}
            />
          </label>
          <label className={styles.label}>
            Event Type
            <select className={styles.select} {...register("eventType")}>
              <option value="">Any</option>
              {Object.entries(EVENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {/* DAYS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>DAYS</legend>
          {daysDisabled && (
            <Toggletip
              label="Why are day filters disabled?"
              message="Clear the Start Date fields in Time filters to use day checkboxes."
            />
          )}
          <ToggleTileGroup
            value={days ? days.split(",") : []}
            onValueChange={(v) =>
              setValue("days", DAY_KEYS.filter((d) => v.includes(d)).join(","))
            }
            disabled={daysDisabled}
            className={styles.dayTiles}
          >
            {DAY_KEYS.map((key) => (
              <ToggleTile key={key} value={key}>
                {DAY_LABELS[key]}
              </ToggleTile>
            ))}
          </ToggleTileGroup>
        </fieldset>

        {/* TIME */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>TIME</legend>
          <div className={styles.rangeGroup}>
            Start Date:
            {startDateDisabled && (
              <Toggletip
                label="Why are Start Date fields disabled?"
                message="Clear the day checkboxes above to use custom Start Date fields."
              />
            )}
            <label className={styles.label}>
              from
              <input
                type="datetime-local"
                className={styles.input}
                disabled={startDateDisabled}
                {...register("startDateTimeStart")}
              />
            </label>
            <label className={styles.label}>
              to
              <input
                type="datetime-local"
                className={styles.input}
                disabled={startDateDisabled}
                {...register("startDateTimeEnd")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Duration (hours):
            <label className={styles.label}>
              from
              <input
                type="number"
                min="0"
                step="0.5"
                className={styles.input}
                {...register("durationMin")}
              />
            </label>
            <label className={styles.label}>
              to
              <input
                type="number"
                min="0"
                step="0.5"
                className={styles.input}
                {...register("durationMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            End Date:
            {startDateDisabled && (
              <Toggletip
                label="Why are End Date fields disabled?"
                message="Clear the day checkboxes above to use custom End Date fields."
              />
            )}
            <label className={styles.label}>
              from
              <input
                type="datetime-local"
                className={styles.input}
                disabled={startDateDisabled}
                {...register("endDateTimeStart")}
              />
            </label>
            <label className={styles.label}>
              to
              <input
                type="datetime-local"
                className={styles.input}
                disabled={startDateDisabled}
                {...register("endDateTimeEnd")}
              />
            </label>
          </div>
        </fieldset>

        {/* PLAYERS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>PLAYERS</legend>
          <div className={styles.rangeGroup}>
            Min Players:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("minPlayersMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("minPlayersMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Max Players:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("maxPlayersMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("maxPlayersMax")}
              />
            </label>
          </div>
          <label className={styles.label}>
            Age Required
            <select className={styles.select} {...register("ageRequired")}>
              <option value="">Any</option>
              {Object.entries(AGE_GROUPS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Experience Required
            <select
              className={styles.select}
              {...register("experienceRequired")}
            >
              <option value="">Any</option>
              {Object.entries(EXP).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {/* LOGISTICS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>LOGISTICS</legend>
          <label className={styles.label}>
            Location{" "}
            <input
              type="text"
              className={styles.input}
              {...register("location")}
            />
          </label>
          <label className={styles.label}>
            Room Name{" "}
            <input
              type="text"
              className={styles.input}
              {...register("roomName")}
            />
          </label>
          <label className={styles.label}>
            Table{" "}
            <input
              type="text"
              className={styles.input}
              {...register("tableNumber")}
            />
          </label>
          <div className={styles.rangeGroup}>
            Cost:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("costMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("costMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Tickets Available:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("ticketsAvailableMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("ticketsAvailableMax")}
              />
            </label>
          </div>
          <label className={styles.label}>
            Attendee Registration
            <select
              className={styles.select}
              {...register("attendeeRegistration")}
            >
              <option value="">Any</option>
              {Object.entries(REGISTRATION).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {/* DETAILS */}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>DETAILS</legend>
          <label className={styles.label}>
            Game ID{" "}
            <input
              type="text"
              className={styles.input}
              {...register("gameId")}
            />
          </label>
          <label className={styles.label}>
            Title{" "}
            <input
              type="text"
              className={styles.input}
              {...register("title")}
            />
          </label>
          <label className={styles.label}>
            Group{" "}
            <input
              type="text"
              className={styles.input}
              {...register("group")}
            />
          </label>
          <label className={styles.label}>
            Short Description{" "}
            <input
              type="text"
              className={styles.input}
              {...register("shortDescription")}
            />
          </label>
          <label className={styles.label}>
            Long Description{" "}
            <input
              type="text"
              className={styles.input}
              {...register("longDescription")}
            />
          </label>
          <label className={styles.label}>
            Game System{" "}
            <input
              type="text"
              className={styles.input}
              {...register("gameSystem")}
            />
          </label>
          <label className={styles.label}>
            Rules Edition{" "}
            <input
              type="text"
              className={styles.input}
              {...register("rulesEdition")}
            />
          </label>
          <label className={styles.label}>
            Materials Provided{" "}
            <input
              type="text"
              className={styles.input}
              {...register("materialsProvided")}
            />
          </label>
          <label className={styles.label}>
            Materials Required{" "}
            <input
              type="text"
              className={styles.input}
              {...register("materialsRequired")}
            />
          </label>
          <label className={styles.label}>
            Materials Required Details{" "}
            <input
              type="text"
              className={styles.input}
              {...register("materialsRequiredDetails")}
            />
          </label>
          <label className={styles.label}>
            Game Masters{" "}
            <input
              type="text"
              className={styles.input}
              {...register("gmNames")}
            />
          </label>
          <label className={styles.label}>
            Website{" "}
            <input
              type="text"
              className={styles.input}
              {...register("website")}
            />
          </label>
          <label className={styles.label}>
            Email{" "}
            <input
              type="text"
              className={styles.input}
              {...register("email")}
            />
          </label>
          <label className={styles.label}>
            Tournament{" "}
            <input
              type="text"
              className={styles.input}
              {...register("tournament")}
            />
          </label>
          <div className={styles.rangeGroup}>
            Round Number:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("roundNumberMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("roundNumberMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Total Rounds:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("totalRoundsMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("totalRoundsMax")}
              />
            </label>
          </div>
          <div className={styles.rangeGroup}>
            Minimum Play Time:
            <label className={styles.label}>
              from{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("minimumPlayTimeMin")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="number"
                min="0"
                className={styles.input}
                {...register("minimumPlayTimeMax")}
              />
            </label>
          </div>
          <label className={styles.label}>
            Special Category
            <select className={styles.select} {...register("specialCategory")}>
              <option value="">Any</option>
              {Object.entries(CATEGORY).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.rangeGroup}>
            Last Modified:
            <label className={styles.label}>
              from{" "}
              <input
                type="datetime-local"
                className={styles.input}
                {...register("lastModifiedStart")}
              />
            </label>
            <label className={styles.label}>
              to{" "}
              <input
                type="datetime-local"
                className={styles.input}
                {...register("lastModifiedEnd")}
              />
            </label>
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
