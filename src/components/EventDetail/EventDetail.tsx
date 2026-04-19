import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "@tanstack/react-router";
import { fetchEvents } from "../../utils/api";
import { Button } from "../../ui/Button/Button";
import { PixelState } from "../../ui/PixelState/PixelState";
import { Badge, BoolBadge } from "../../ui/Badge/Badge";
import styles from "./EventDetail.module.css";

interface EventDetailProps {
  gameId: string;
}

export function EventDetail({ gameId }: EventDetailProps) {
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
      <PixelState
        variant="empty"
        text="EVENT NOT FOUND"
        subtext="This quest does not exist."
      />
    );
  }

  const a = data.data[0].attributes;

  return (
    <article className={styles.article}>
      <Button
        render={<Link to="/" />}
        variant="secondary"
        className={styles.backLink}
      >
        ← Back to results
      </Button>

      <div className={styles.card}>
        <p className={styles.gameIdBadge}>{a.gameId}</p>
        <h1 className={styles.title}>{a.title}</h1>

        {/* THE EVENT */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>THE EVENT</h2>
          <dl className={styles.dl}>
            <div className={styles.dlFull}>
              <dt className={styles.dt}>Short Description</dt>
              <dd className={styles.dd}>{a.shortDescription}</dd>
            </div>
            <div className={styles.dlFull}>
              <dt className={styles.dt}>Long Description</dt>
              <dd className={styles.dd}>{a.longDescription}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Event Type</dt>
              <dd className={styles.dd}>{a.eventType}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Group</dt>
              <dd className={styles.dd}>{a.group}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Game System</dt>
              <dd className={styles.dd}>{a.gameSystem}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Rules Edition</dt>
              <dd className={styles.dd}>{a.rulesEdition}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Special Category</dt>
              <dd className={styles.dd}>{a.specialCategory}</dd>
            </div>
          </dl>
        </section>

        {/* PLAYERS */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>PLAYERS</h2>
          <dl className={styles.dl}>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Min Players</dt>
              <dd className={styles.dd}>{a.minPlayers}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Max Players</dt>
              <dd className={styles.dd}>{a.maxPlayers}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Age Required</dt>
              <dd className={styles.dd}>{a.ageRequired}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Experience Required</dt>
              <dd className={styles.dd}>{a.experienceRequired}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Tournament</dt>
              <dd className={styles.dd}>
                <BoolBadge value={a.tournament} />
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Round</dt>
              <dd className={styles.dd}>
                {a.roundNumber} of {a.totalRounds}
              </dd>
            </div>
          </dl>
        </section>

        {/* LOGISTICS */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>LOGISTICS</h2>
          <dl className={styles.dl}>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Day</dt>
              <dd className={styles.dd}>
                {format(new Date(a.startDateTime), "EEEE")}
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Start</dt>
              <dd className={styles.dd}>
                {format(new Date(a.startDateTime), "HH:mm")}
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>End</dt>
              <dd className={styles.dd}>
                {format(new Date(a.endDateTime), "HH:mm")}
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Duration</dt>
              <dd className={styles.dd}>{a.duration} hours</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Min Play Time</dt>
              <dd className={styles.dd}>{a.minimumPlayTime} hours</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Location</dt>
              <dd className={styles.dd}>{a.location}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Room</dt>
              <dd className={styles.dd}>{a.roomName}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Table</dt>
              <dd className={styles.dd}>{a.tableNumber}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Cost</dt>
              <dd className={styles.dd}>${a.cost.toFixed(2)}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Attendee Registration</dt>
              <dd className={styles.dd}>
                <Badge
                  variant={
                    a.attendeeRegistration === "ticketed" ? "filled" : "outline"
                  }
                >
                  {a.attendeeRegistration}
                </Badge>
              </dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Tickets Available</dt>
              <dd className={styles.dd}>{a.ticketsAvailable}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Materials Provided</dt>
              <dd className={styles.dd}>
                <BoolBadge value={a.materialsProvided} />
              </dd>
            </div>
            <div className={styles.dlFull}>
              <dt className={styles.dt}>Materials Required</dt>
              <dd className={styles.dd}>{a.materialsRequired}</dd>
            </div>
            <div className={styles.dlFull}>
              <dt className={styles.dt}>Materials Required Details</dt>
              <dd className={styles.dd}>{a.materialsRequiredDetails}</dd>
            </div>
          </dl>
        </section>

        {/* CONTACT */}
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>CONTACT</h2>
          <dl className={styles.dl}>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>GMs</dt>
              <dd className={styles.dd}>{a.gmNames}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Website</dt>
              <dd className={styles.dd}>{a.website || "—"}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Email</dt>
              <dd className={styles.dd}>{a.email || "—"}</dd>
            </div>
            <div className={styles.dlItem}>
              <dt className={styles.dt}>Last Modified</dt>
              <dd className={styles.dd}>
                {format(new Date(a.lastModified), "yyyy-MM-dd")}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </article>
  );
}
