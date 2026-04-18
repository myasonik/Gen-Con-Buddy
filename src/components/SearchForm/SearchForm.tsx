import { useForm } from "react-hook-form";
import {
  AGE_GROUPS,
  CATEGORY,
  EVENT_TYPES,
  EXP,
  REGISTRATION,
} from "../../utils/enums";
import type { SearchFormValues } from "../../utils/types";

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
  const selectedDays = new Set(days ? days.split(",") : []);

  const handleDayChange = (key: string, checked: boolean) => {
    const next = new Set(selectedDays);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    setValue("days", DAY_KEYS.filter((d) => next.has(d)).join(","));
  };

  return (
    <form onSubmit={handleSubmit(onSearch)}>
      <div>
        <label>
          Search
          <input type="text" {...register("filter")} />
        </label>
        <label>
          Event Type
          <select {...register("eventType")}>
            <option value="">Any</option>
            {Object.entries(EVENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Days</legend>
          {DAY_KEYS.map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={selectedDays.has(key)}
                onChange={(e) => handleDayChange(key, e.target.checked)}
              />
              {DAY_LABELS[key]}
            </label>
          ))}
        </fieldset>
      </div>

      <details>
        <summary>Advanced filters</summary>
        <ul>
          <li>
            <label>
              Game ID <input type="text" {...register("gameId")} />
            </label>
          </li>
          <li>
            <label>
              Title <input type="text" {...register("title")} />
            </label>
          </li>
          <li>
            <label>
              Group <input type="text" {...register("group")} />
            </label>
          </li>
          <li>
            <label>
              Short Description{" "}
              <input type="text" {...register("shortDescription")} />
            </label>
          </li>
          <li>
            <label>
              Long Description{" "}
              <input type="text" {...register("longDescription")} />
            </label>
          </li>
          <li>
            <label>
              Game System <input type="text" {...register("gameSystem")} />
            </label>
          </li>
          <li>
            <label>
              Rules Edition <input type="text" {...register("rulesEdition")} />
            </label>
          </li>
          <li>
            Min Players:
            <label>
              from{" "}
              <input type="number" min="0" {...register("minPlayersMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("minPlayersMax")} />
            </label>
          </li>
          <li>
            Max Players:
            <label>
              from{" "}
              <input type="number" min="0" {...register("maxPlayersMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("maxPlayersMax")} />
            </label>
          </li>
          <li>
            <label>
              Age Required
              <select {...register("ageRequired")}>
                <option value="">Any</option>
                {Object.entries(AGE_GROUPS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </li>
          <li>
            <label>
              Experience Required
              <select {...register("experienceRequired")}>
                <option value="">Any</option>
                {Object.entries(EXP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </li>
          <li>
            <label>
              Materials Provided{" "}
              <input type="text" {...register("materialsProvided")} />
            </label>
          </li>
          <li>
            <label>
              Materials Required{" "}
              <input type="text" {...register("materialsRequired")} />
            </label>
          </li>
          <li>
            <label>
              Materials Required Details{" "}
              <input type="text" {...register("materialsRequiredDetails")} />
            </label>
          </li>
          <li>
            Start Date:
            <label>
              from{" "}
              <input
                type="datetime-local"
                {...register("startDateTimeStart")}
              />
            </label>
            <label>
              to{" "}
              <input type="datetime-local" {...register("startDateTimeEnd")} />
            </label>
          </li>
          <li>
            Duration (hours):
            <label>
              from <input type="number" min="0" {...register("durationMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("durationMax")} />
            </label>
          </li>
          <li>
            End Date:
            <label>
              from{" "}
              <input type="datetime-local" {...register("endDateTimeStart")} />
            </label>
            <label>
              to <input type="datetime-local" {...register("endDateTimeEnd")} />
            </label>
          </li>
          <li>
            <label>
              Game Masters <input type="text" {...register("gmNames")} />
            </label>
          </li>
          <li>
            <label>
              Website <input type="text" {...register("website")} />
            </label>
          </li>
          <li>
            <label>
              Email <input type="text" {...register("email")} />
            </label>
          </li>
          <li>
            <label>
              Tournament <input type="text" {...register("tournament")} />
            </label>
          </li>
          <li>
            Round Number:
            <label>
              from{" "}
              <input type="number" min="0" {...register("roundNumberMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("roundNumberMax")} />
            </label>
          </li>
          <li>
            Total Rounds:
            <label>
              from{" "}
              <input type="number" min="0" {...register("totalRoundsMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("totalRoundsMax")} />
            </label>
          </li>
          <li>
            Minimum Play Time:
            <label>
              from{" "}
              <input
                type="number"
                min="0"
                {...register("minimumPlayTimeMin")}
              />
            </label>
            <label>
              to{" "}
              <input
                type="number"
                min="0"
                {...register("minimumPlayTimeMax")}
              />
            </label>
          </li>
          <li>
            <label>
              Attendee Registration
              <select {...register("attendeeRegistration")}>
                <option value="">Any</option>
                {Object.entries(REGISTRATION).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </li>
          <li>
            Cost:
            <label>
              from <input type="number" min="0" {...register("costMin")} />
            </label>
            <label>
              to <input type="number" min="0" {...register("costMax")} />
            </label>
          </li>
          <li>
            <label>
              Location <input type="text" {...register("location")} />
            </label>
          </li>
          <li>
            <label>
              Room Name <input type="text" {...register("roomName")} />
            </label>
          </li>
          <li>
            <label>
              Table <input type="text" {...register("tableNumber")} />
            </label>
          </li>
          <li>
            <label>
              Special Category
              <select {...register("specialCategory")}>
                <option value="">Any</option>
                {Object.entries(CATEGORY).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </li>
          <li>
            Tickets Available:
            <label>
              from{" "}
              <input
                type="number"
                min="0"
                {...register("ticketsAvailableMin")}
              />
            </label>
            <label>
              to{" "}
              <input
                type="number"
                min="0"
                {...register("ticketsAvailableMax")}
              />
            </label>
          </li>
          <li>
            Last Modified:
            <label>
              from{" "}
              <input type="datetime-local" {...register("lastModifiedStart")} />
            </label>
            <label>
              to{" "}
              <input type="datetime-local" {...register("lastModifiedEnd")} />
            </label>
          </li>
        </ul>
      </details>

      <button type="submit">Search</button>
      <button type="button" onClick={() => reset(EMPTY_VALUES)}>
        Reset
      </button>
    </form>
  );
}
