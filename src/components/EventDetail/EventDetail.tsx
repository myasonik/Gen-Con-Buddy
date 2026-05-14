import React, { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { fetchEvents } from "../../utils/api";
import { buildGoogleCalendarUrl, genConEventId } from "../../utils/googleCalendar";
import { Button } from "../../ui/Button/Button";
import { Chip } from "../../ui/Chip/Chip";
import { EmptyState } from "../../ui/EmptyState/EmptyState";
import { DescriptionList, DescriptionItem } from "../../ui/DescriptionList/DescriptionList";
import { EVENT_TYPE_ICONS } from "../../ui/icons/eventTypeIcons";
import { CalendarPlus, ExternalLink } from "lucide-react";
import { useDayFormat } from "../../hooks/useDayFormat";
import { useTimeZone } from "../../hooks/useTimeZone";
import { useTimeFormat } from "../../hooks/useTimeFormat";
import { usePageTitle } from "../../lib/usePageTitle";
import { formatDay, formatTime, toDisplayDate } from "../../utils/formatDay";
import { STAFF_PICK_IDS } from "../../utils/staffPicks";
import { normalizeUrl } from "./normalizeUrl";
import { normalizeEmail } from "./normalizeEmail";
import styles from "./EventDetail.module.css";

interface EventDetailProps {
  gameId: string;
}

export function EventDetail({ gameId }: EventDetailProps): React.JSX.Element {
  const posthog = usePostHog();
  const router = useRouter();
  const location = useLocation();
  const fromChangelog = location.state.from === "changelog";
  const { data, isLoading, isError } = useQuery({
    queryKey: ["event", gameId],
    queryFn: () => fetchEvents({ gameId, limit: 1 }),
  });
  const { dayFormat } = useDayFormat();
  const { timeZone } = useTimeZone();
  const { timeFormat } = useTimeFormat();
  const event = data?.data[0];
  usePageTitle(
    event ? `${event.attributes.title} (${event.attributes.gameId}) | Gen Con Buddy` : undefined,
  );

  useEffect(() => {
    if (!event) {
      return;
    }
    const a = event.attributes;
    posthog.capture("event_detail_viewed", {
      game_id: a.gameId,
      title: a.title,
      event_type: a.eventType,
      cost: a.cost,
      tickets_available: a.ticketsAvailable,
    });
  }, [event, event?.attributes, posthog]);

  if (isLoading) {
    return <EmptyState variant="loading" text="LOADING QUEST..." />;
  }
  if (isError) {
    return (
      <EmptyState
        variant="error"
        text="QUEST FAILED"
        subtext="Unable to load event. Please try again."
      />
    );
  }
  if (!data || data.data.length === 0) {
    return (
      <EmptyState variant="empty" text="EVENT NOT FOUND" subtext="This quest does not exist." />
    );
  }

  const a = data.data[0].attributes;
  const isStaffPick = STAFF_PICK_IDS.has(a.gameId);

  return (
    <article className={styles.article}>
      {fromChangelog ? (
        <Button
          onClick={() => router.history.back()}
          variant="secondary"
          className={styles.backLink}
        >
          ← Back to changelog
        </Button>
      ) : (
        <Button render={<Link to="/" />} variant="secondary" className={styles.backLink}>
          ← Back to results
        </Button>
      )}

      <div className={styles.card} data-staff-pick={isStaffPick || undefined}>
        <div className={styles.hero}>
          <p className={styles.gameIdBadge}>{a.gameId}</p>
          {isStaffPick && (
            <p className={styles.staffPickLabel}>
              <Chip tone="accent" size="sm">Staff Pick</Chip>
            </p>
          )}
          <h1 className={styles.title}>{a.title}</h1>
        </div>

        <div className={styles.actions}>
          <Button
            render={
              <a
                href={buildGoogleCalendarUrl(a)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  posthog.capture("google_calendar_clicked", {
                    game_id: a.gameId,
                    title: a.title,
                  })
                }
              />
            }
            variant="secondary"
            className={styles.actionButton}
          >
            <CalendarPlus aria-hidden="true" className={styles.actionIcon} />
            Add to Google Calendar
          </Button>
          <Button
            render={
              <a
                href={`https://www.gencon.com/events/${genConEventId(a.gameId)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  posthog.capture("gencon_link_clicked", {
                    game_id: a.gameId,
                    title: a.title,
                  })
                }
              />
            }
            variant="secondary"
            className={styles.actionButton}
          >
            <ExternalLink aria-hidden="true" className={styles.actionIcon} />
            View on Gen Con
          </Button>
        </div>

        {/* THE EVENT */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>THE EVENT</h2>
          <DescriptionList>
            <DescriptionItem term="Short Description" span="full">
              {a.shortDescription}
            </DescriptionItem>
            <DescriptionItem term="Long Description" span="full">
              {a.longDescription}
            </DescriptionItem>
            <DescriptionItem term="Event Type">
              {(() => {
                const Icon = EVENT_TYPE_ICONS[a.eventType.split(" - ")[0]];
                return (
                  <span className={styles.eventType}>
                    {Icon && <Icon size={16} />}
                    {a.eventType}
                  </span>
                );
              })()}
            </DescriptionItem>
            <DescriptionItem term="Group">{a.group}</DescriptionItem>
            <DescriptionItem term="Game System">{a.gameSystem}</DescriptionItem>
            <DescriptionItem term="Rules Edition">{a.rulesEdition}</DescriptionItem>
            <DescriptionItem term="Special Category">
                  {a.specialCategory.toLowerCase() === "none" ? "None" : a.specialCategory}
                </DescriptionItem>
          </DescriptionList>
        </section>

        {/* PLAYERS */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>PLAYERS</h2>
          <DescriptionList>
            <DescriptionItem term="Min Players">{a.minPlayers}</DescriptionItem>
            <DescriptionItem term="Max Players">{a.maxPlayers}</DescriptionItem>
            <DescriptionItem term="Age Required">{a.ageRequired}</DescriptionItem>
            <DescriptionItem term="Experience Required">{a.experienceRequired}</DescriptionItem>
            <DescriptionItem term="Tournament">{a.tournament}</DescriptionItem>
            <DescriptionItem term="Round">
              {a.roundNumber} of {a.totalRounds}
            </DescriptionItem>
          </DescriptionList>
        </section>

        {/* LOGISTICS */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>LOGISTICS</h2>
          <DescriptionList>
            <DescriptionItem term="Day">
              {formatDay(toDisplayDate(a.startDateTime, timeZone), dayFormat)}
            </DescriptionItem>
            <DescriptionItem term="Start">
              {formatTime(toDisplayDate(a.startDateTime, timeZone), timeFormat)}
            </DescriptionItem>
            <DescriptionItem term="End">
              {formatTime(toDisplayDate(a.endDateTime, timeZone), timeFormat)}
            </DescriptionItem>
            <DescriptionItem term="Duration">{a.duration} hours</DescriptionItem>
            <DescriptionItem term="Min Play Time">{a.minimumPlayTime} hours</DescriptionItem>
            <DescriptionItem term="Location">{a.location}</DescriptionItem>
            <DescriptionItem term="Room">{a.roomName}</DescriptionItem>
            <DescriptionItem term="Table">{a.tableNumber}</DescriptionItem>
            <DescriptionItem term="Cost">${a.cost.toFixed(2)}</DescriptionItem>
            <DescriptionItem term="Attendee Registration">{a.attendeeRegistration}</DescriptionItem>
            <DescriptionItem term="Tickets Available">
              {a.ticketsAvailable === 0 ? (
                <Chip tone="error" size="sm">
                  Sold out
                </Chip>
              ) : (
                a.ticketsAvailable
              )}
            </DescriptionItem>
            <DescriptionItem term="Materials Provided">{a.materialsProvided}</DescriptionItem>
            <DescriptionItem term="Materials Required" span="full">
              {a.materialsRequired}
            </DescriptionItem>
            <DescriptionItem term="Materials Required Details" span="full">
              {a.materialsRequiredDetails}
            </DescriptionItem>
          </DescriptionList>
        </section>

        {/* CONTACT */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>CONTACT</h2>
          <DescriptionList>
            <DescriptionItem term="GMs">{a.gmNames}</DescriptionItem>
            <DescriptionItem term="Website">
              {(() => {
                const href = normalizeUrl(a.website);
                return href ? (
                  <a href={href} target="_blank" rel="noreferrer noopener">
                    {a.website}
                  </a>
                ) : (
                  a.website
                );
              })()}
            </DescriptionItem>
            <DescriptionItem term="Email">
              {(() => {
                const href = normalizeEmail(a.email);
                return href ? <a href={href}>{a.email}</a> : a.email;
              })()}
            </DescriptionItem>
            <DescriptionItem term="Last Modified">
              {format(new Date(a.lastModified), "yyyy-MM-dd")}
            </DescriptionItem>
          </DescriptionList>
        </section>
      </div>
    </article>
  );
}
