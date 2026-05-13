import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import {
  STAFF_PICK_GROUP,
  STAFF_PICK_HEADING,
  STAFF_PICK_SUBTEXT,
} from "../../utils/staffPicks";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { EventTable } from "../EventTable/EventTable";
import { EventListMobile } from "../EventTable/EventListMobile";
import { VisibilityDrawer } from "../EventTable/VisibilityDrawer";
import { SortDrawer } from "../EventTable/SortDrawer";
import styles from "./StaffPickCallout.module.css";

export function StaffPickCallout(): React.JSX.Element | null {
  const isMobile = useMediaQuery("(width <= 60rem)");
  const sharedColumnState = useSharedColumnState();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["staffPick"],
    queryFn: () => fetchEvents({ group: STAFF_PICK_GROUP, limit: 10 }),
  });

  if (isLoading || isError || !data || data.data.length === 0) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>{STAFF_PICK_HEADING}</h2>
      <p className={styles.subtext}>{STAFF_PICK_SUBTEXT}</p>
      <div className={styles.controls}>
        <VisibilityDrawer columnState={sharedColumnState} />
        <SortDrawer />
      </div>
      {!isMobile ? (
        <div className={styles.tableView}>
          <EventTable events={data.data} sharedColumnState={sharedColumnState} />
        </div>
      ) : (
        <EventListMobile
          events={data.data}
          visibility={sharedColumnState.visibility}
          typeDisplay={sharedColumnState.typeDisplay}
          showTypeIcon={sharedColumnState.showTypeIcon}
          dayFormat={sharedColumnState.dayFormat}
          timeZone={sharedColumnState.timeZone}
          timeFormat={sharedColumnState.timeFormat}
        />
      )}
    </div>
  );
}
