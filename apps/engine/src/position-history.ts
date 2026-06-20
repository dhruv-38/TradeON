import { recentPositionHistory, type Position } from "@repo/market";

const MAX_RECENT_POSITIONS = 200;

export const rememberRecentPosition = (position: Position) => {
  const existingIndex = recentPositionHistory.findIndex(
    (candidate) => candidate.id === position.id,
  );
  if (existingIndex !== -1) {
    recentPositionHistory.splice(existingIndex, 1);
  }

  recentPositionHistory.unshift(position);
  if (recentPositionHistory.length > MAX_RECENT_POSITIONS) {
    recentPositionHistory.length = MAX_RECENT_POSITIONS;
  }
};

export const forgetRecentPosition = (positionId: string) => {
  const index = recentPositionHistory.findIndex(
    (position) => position.id === positionId,
  );
  if (index !== -1) {
    recentPositionHistory.splice(index, 1);
  }
};
