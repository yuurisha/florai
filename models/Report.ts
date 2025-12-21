export interface ReportSummary {
  reportID: string;
  postID?: string;
  replyID?: string;
  eventID?: number;
  createdAt: string;
  reason?: string;
  reporterID: string;
}
