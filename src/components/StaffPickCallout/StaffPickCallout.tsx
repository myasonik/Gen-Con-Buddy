import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../../utils/api";
import {
  WILDHAVENS_GAME_IDS,
  STAFF_PICK_PREAMBLE,
  STAFF_PICK_PREAMBLE_DETAIL,
} from "../../utils/staffPicks";
import { useSharedColumnState } from "../../hooks/useSharedColumnState";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { EventTable } from "../EventTable/EventTable";
import { EventListMobile } from "../EventTable/EventListMobile";
import { VisibilityDrawer } from "../EventTable/VisibilityDrawer";
import { FormatDrawer } from "../EventTable/FormatDrawer";
import { SortDrawer } from "../EventTable/SortDrawer";
import styles from "./StaffPickCallout.module.css";

export function StaffPickCallout(): React.JSX.Element | null {
  const isMobile = useMediaQuery("(width <= 60rem)");
  const sharedColumnState = useSharedColumnState();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["staffPick"],
    queryFn: () => fetchEvents({ gameId: WILDHAVENS_GAME_IDS.join(",") }),
  });

  if (isLoading || isError || !data || data.data.length === 0) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>Staff Picks</h2>
      <p className={styles.preamble}>{STAFF_PICK_PREAMBLE}</p>
      <p className={styles.preambleDetail}>{STAFF_PICK_PREAMBLE_DETAIL}</p>
      <div className={styles.controls}>
        <VisibilityDrawer columnState={sharedColumnState} />
        <FormatDrawer columnState={sharedColumnState} />
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
