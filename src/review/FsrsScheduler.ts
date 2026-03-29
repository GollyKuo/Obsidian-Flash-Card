import { Card as FSRSCard, FSRS, Rating, State } from "ts-fsrs";
import { FSRSState } from "../store/types";

export type ReviewRating =
    | Rating.Again
    | Rating.Hard
    | Rating.Good
    | Rating.Easy;

const stateMap: Record<FSRSState["state"], State> = {
    new: State.New,
    learning: State.Learning,
    review: State.Review,
    relearning: State.Relearning,
};

const stateRevMap: Record<number, FSRSState["state"]> = {
    [State.New]: "new",
    [State.Learning]: "learning",
    [State.Review]: "review",
    [State.Relearning]: "relearning",
};

export class FsrsScheduler {
    private fsrs = new FSRS({});

    review(
        current: FSRSState,
        rating: ReviewRating,
        now: Date = new Date()
    ): FSRSState {
        const card: FSRSCard = {
            due: new Date(current.due),
            stability: current.stability,
            difficulty: current.difficulty,
            elapsed_days: 0,
            scheduled_days: 0,
            reps: current.reps,
            lapses: current.lapses,
            state: stateMap[current.state] ?? State.New,
            last_review: current.lastReview
                ? new Date(current.lastReview)
                : undefined,
        };

        const result = this.fsrs.repeat(card, now);
        const next = result[rating];

        return {
            ...current,
            lastReview: now.toISOString(),
            due: next.card.due.toISOString(),
            state: stateRevMap[next.card.state] ?? "new",
            reps: next.card.reps,
            lapses: next.card.lapses,
            difficulty: next.card.difficulty,
            stability: next.card.stability,
            retrievability: 1,
        };
    }
}
