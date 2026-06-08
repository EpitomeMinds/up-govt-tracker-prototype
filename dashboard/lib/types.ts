export interface Job {
  id: string;
  state_code: string;
  post_date: string;
  post_board: string;
  post_name: string;
  qualification: string;
  advt_no: string;
  last_date: string;
  last_date_parsed: string | null;
  link: string;
  scraped_at: string;
  is_active: number;
}

export interface JobsResponse {
  data: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface Stats {
  stateCode: string;
  total: number;
  closingThisWeek: number;
  newThisWeek: number;
  topBoards: { board: string; count: number }[];
  lastSync: {
    synced_at: string;
    job_count: number;
    status: string;
  } | null;
}

export interface State {
  code: string;
  name: string;
  link: string;
}
