import {
  addDays,
  addMonths,
  getDay,
  setHours,
  setMilliseconds,
  setMinutes,
  setSeconds,
  startOfMonth,
} from 'date-fns';

export default () => {
  const currentDate = new Date();
  const augOne = startOfMonth(
    addMonths(currentDate, 7 - currentDate.getMonth()),
  );

  // Find the day of the week for the first day of August (0 is Sunday, 1 is Monday, ..., 6 is Saturday)
  const dayOfWeek = getDay(augOne);

  // Calculate the number of days to add to reach the first Thursday
  const daysToAdd = dayOfWeek <= 4 ? 4 - dayOfWeek : 11 - dayOfWeek;

  // Get the date of the first Thursday of August
  const firstWedOfAug = addDays(augOne, daysToAdd);

  // Set the time to midnight (00:00:00) EST
  return setMilliseconds(
    setSeconds(setMinutes(setHours(firstWedOfAug, 0), 0), 0),
    0,
  );
};
