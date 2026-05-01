import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { fetchEvents } from "../../utils/api";
import { buildGoogleCalendarUrl } from "../../utils/googleCalendar";
import { Button } from "../../ui/Button/Button";
import { PixelState } from "../../ui/PixelState/PixelState";
import { Badge, BoolBadge } from "../../ui/Badge/Badge";
import { DescriptionList, DescriptionItem } from "../../ui/DescriptionList/DescriptionList";
import { CalendarPlus } from "../../ui/icons/CalendarPlus";
import { ExternalLink } from "../../ui/icons/ExternalLink";
import styles from "./EventDetail.module.css";

interface EventDetailProps {
  gameId: string;
}

export function EventDetail({ gameId }: EventDetailProps): JSX.Element {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["event", gameId],
    queryFn: () => fetchEvents({ gameId, limit: 1 }),
  });

  if (isLoading) {
    return <PixelState variant="loading" text="LOADING QUEST..." />;
  }
  if (isError) {
    return (
      <PixelState
        variant="error"
        text="QUEST FAILED"
        subtext="Unable to load event. Please try again."
      />
    );
  }
  if (!data || data.data.length === 0) {
    return (
      <PixelState variant="empty" text="EVENT NOT FOUND" subtext="This quest does not exist." />
    );
  }

  const a = data.data[0].attributes;

  return (
    <article className={styles.article}>
      <Button render={<Link to="/" />} variant="secondary" className={styles.backLink}>
        ← Back to results
      </Button>

      <div className={styles.card}>
        <p className={styles.gameIdBadge}>{a.gameId}</p>
        <h1 className={styles.title}>{a.title}</h1>

        <div className={styles.actions}>
          <Button
            render={
              <a href={buildGoogleCalendarUrl(a)} target="_blank" rel="noopener noreferrer" />
            }
            variant="ghost"
            className={styles.actionButton}
          >
            <CalendarPlus aria-hidden="true" className={styles.actionIcon} />
            Add to Google Calendar
          </Button>
          <Button
            render={
              <a
                href={`https://www.gencon.com/events/${a.gameId}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
            variant="ghost"
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
            <DescriptionItem term="Event Type">{a.eventType}</DescriptionItem>
            <DescriptionItem term="Group">{a.group}</DescriptionItem>
            <DescriptionItem term="Game System">{a.gameSystem}</DescriptionItem>
            <DescriptionItem term="Rules Edition">{a.rulesEdition}</DescriptionItem>
            <DescriptionItem term="Special Category">{a.specialCategory}</DescriptionItem>
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
            <DescriptionItem term="Tournament">
              <BoolBadge value={a.tournament} />
            </DescriptionItem>
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
              {format(new Date(a.startDateTime), "EEEE")}
            </DescriptionItem>
            <DescriptionItem term="Start">
              {format(new Date(a.startDateTime), "HH:mm")}
            </DescriptionItem>
            <DescriptionItem term="End">{format(new Date(a.endDateTime), "HH:mm")}</DescriptionItem>
            <DescriptionItem term="Duration">{a.duration} hours</DescriptionItem>
            <DescriptionItem term="Min Play Time">{a.minimumPlayTime} hours</DescriptionItem>
            <DescriptionItem term="Location">{a.location}</DescriptionItem>
            <DescriptionItem term="Room">{a.roomName}</DescriptionItem>
            <DescriptionItem term="Table">{a.tableNumber}</DescriptionItem>
            <DescriptionItem term="Cost">${a.cost.toFixed(2)}</DescriptionItem>
            <DescriptionItem term="Attendee Registration">
              <Badge variant={a.attendeeRegistration === "ticketed" ? "filled" : "outline"}>
                {a.attendeeRegistration}
              </Badge>
            </DescriptionItem>
            <DescriptionItem term="Tickets Available">{a.ticketsAvailable}</DescriptionItem>
            <DescriptionItem term="Materials Provided">
              <BoolBadge value={a.materialsProvided} />
            </DescriptionItem>
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
            <DescriptionItem term="Website">{a.website || "—"}</DescriptionItem>
            <DescriptionItem term="Email">{a.email || "—"}</DescriptionItem>
            <DescriptionItem term="Last Modified">
              {format(new Date(a.lastModified), "yyyy-MM-dd")}
            </DescriptionItem>
          </DescriptionList>
        </section>
      </div>
    </article>
  );
}
