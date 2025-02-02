import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authFetcher } from "@/lib/fetcher";
import { dataStateStore, navigationStateStore } from "@/store/store";
import { useUser } from "@propelauth/nextjs/client";
import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useSWR from "swr";

import { Skeleton } from "../../ui/skeleton";

interface NbSessions {
  day: string;
  date: string;
  nb_sessions: number;
}

interface SessionLengthPerDay {
  day: string;
  date: string;
  session_length: number;
}

interface SessionLengthHist {
  session_length: number;
  nb_sessions: number;
}

interface SuccessRateByPosition {
  task_position: number;
  success_rate: number;
}

interface SessionMetrics {
  total_nb_sessions: number;
  average_session_length: number;
  last_task_success_rate: number;
  nb_sessions_per_day: NbSessions[];
  session_length_histogram: SessionLengthHist[];
  session_length_per_day: SessionLengthPerDay[];
  success_rate_per_task_position: SuccessRateByPosition[];
}

const SessionsDataviz: React.FC = () => {
  const { accessToken } = useUser();

  const selectedProject = navigationStateStore(
    (state) => state.selectedProject,
  );
  const project_id = selectedProject?.id;

  const sessionsColumnsFilters = navigationStateStore(
    (state) => state.sessionsColumnsFilters,
  );

  let eventFilter: string | null = null;
  for (let filter of sessionsColumnsFilters) {
    if (
      filter.id === "events" &&
      (typeof filter.value === "string" || filter.value === null)
    ) {
      eventFilter = filter.value;
    }
  }

  const { data: totalNbSessionsData } = useSWR(
    [
      `/api/explore/${project_id}/aggregated/sessions`,
      accessToken,
      eventFilter,
      "total_nb_sessions",
    ],
    ([url, accessToken]) =>
      authFetcher(url, accessToken, "POST", {
        metrics: ["total_nb_sessions"],
        sessions_filter: {
          event_name: eventFilter,
        },
      }),
    {
      keepPreviousData: true,
    },
  );
  const totalNbSessions = totalNbSessionsData?.total_nb_sessions;

  const { data: averageSessionLengthData } = useSWR(
    [
      `/api/explore/${project_id}/aggregated/sessions`,
      accessToken,
      eventFilter,
      "average_session_length",
    ],
    ([url, accessToken]) =>
      authFetcher(url, accessToken, "POST", {
        metrics: ["average_session_length"],
        sessions_filter: {
          event_name: eventFilter,
        },
      }),
    {
      keepPreviousData: true,
    },
  );
  const averageSessionLength =
    Math.round(averageSessionLengthData?.average_session_length * 100) / 100;

  const { data: lastTaskSuccessRateData } = useSWR(
    [
      `/api/explore/${project_id}/aggregated/sessions`,
      accessToken,
      eventFilter,
      "last_task_success_rate",
    ],
    ([url, accessToken]) =>
      authFetcher(url, accessToken, "POST", {
        metrics: ["last_task_success_rate"],
        sessions_filter: {
          event_name: eventFilter,
        },
      }),
    {
      keepPreviousData: true,
    },
  );
  const lastTaskSuccessRate =
    Math.round(lastTaskSuccessRateData?.last_task_success_rate * 10000) / 100;

  const {
    data: nbSessionsPerDay,
  }: {
    data: NbSessions[] | undefined;
  } = useSWR(
    [
      `/api/explore/${project_id}/aggregated/sessions`,
      accessToken,
      eventFilter,
      "nb_sessions_per_day",
    ],
    ([url, accessToken]) =>
      authFetcher(url, accessToken, "POST", {
        metrics: ["nb_sessions_per_day"],
        sessions_filter: {
          event_name: eventFilter,
        },
      }).then((data) => {
        if (!data.nb_sessions_per_day) {
          return [];
        }
        return data.nb_sessions_per_day?.map((element: NbSessions) => {
          const date = new Date(element.date);
          const day = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          element.day = day;
          return element;
        });
      }),
    {
      keepPreviousData: true,
    },
  );

  const {
    data: sessionLengthHistogram,
  }: {
    data: SessionLengthHist[] | undefined;
  } = useSWR(
    [
      `/api/explore/${project_id}/aggregated/sessions`,
      accessToken,
      eventFilter,
      "session_length_histogram",
    ],
    ([url, accessToken, filters]) =>
      authFetcher(url, accessToken, "POST", {
        metrics: ["session_length_histogram"],
        sessions_filter: {
          event_name: eventFilter,
        },
      }).then((data) => {
        if (!data.session_length_histogram) {
          return [];
        }
        return data.session_length_histogram;
      }),
    {
      keepPreviousData: true,
    },
  );

  const {
    data: successRatePerTaskPosition,
  }: {
    data: SuccessRateByPosition[] | undefined;
  } = useSWR(
    [
      `/api/explore/${project_id}/aggregated/sessions`,
      accessToken,
      eventFilter,
      "success_rate_per_task_position",
    ],
    ([url, accessToken]) =>
      authFetcher(url, accessToken, "POST", {
        metrics: ["success_rate_per_task_position"],
        sessions_filter: {
          event_name: eventFilter,
        },
      }).then((data) => {
        if (!data.success_rate_per_task_position) {
          return [];
        }
        return data.success_rate_per_task_position?.map(
          (element: SuccessRateByPosition) => {
            element.success_rate =
              Math.round(element.success_rate * 10000) / 100;
            return element;
          },
        );
      }),
    {
      keepPreviousData: true,
    },
  );

  if (!project_id) {
    return <></>;
  }

  return (
    <div>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Card>
              <CardHeader>
                <CardDescription>Total Nb of Sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {(!totalNbSessions && <p>...</p>) || (
                  <p className="text-xl">{totalNbSessions}</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="ml-4 mr-4">
            <Card>
              <CardHeader>
                <CardDescription>Average Session Length</CardDescription>
              </CardHeader>
              <CardContent>
                {(!averageSessionLength && <p>...</p>) || (
                  <p className="text-xl">{averageSessionLength}</p>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardDescription>Last Task Success Rate</CardDescription>
              </CardHeader>
              <CardContent>
                {(!lastTaskSuccessRate && <p>...</p>) || (
                  <p className="text-xl">{lastTaskSuccessRate} %</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="container mx-auto mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex-1">
            <h3 className="text-slate-500 mb-2">
              Nb of sessions per day (last 7d)
            </h3>
            {(!nbSessionsPerDay && (
              <Skeleton className="w-[100%] h-[150px]" />
            )) ||
              (nbSessionsPerDay && (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart
                    width={300}
                    height={250}
                    data={nbSessionsPerDay}
                    barGap={0}
                    barCategoryGap={0}
                  >
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="nb_sessions"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ))}
          </div>
          <div className="flex-1">
            <h3 className="text-slate-500 mb-2">
              Nb sessions per session length
            </h3>
            {(!sessionLengthHistogram && (
              <Skeleton className="w-[100%] h-[150px]" />
            )) ||
              (sessionLengthHistogram && (
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart
                    width={300}
                    height={250}
                    data={sessionLengthHistogram}
                    barGap={0}
                    barCategoryGap={0}
                  >
                    <XAxis dataKey="session_length" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="nb_sessions"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ))}
          </div>
          <div className="flex-1">
            <h3 className="text-slate-500 mb-2">
              Success Rate per task position
            </h3>
            {(!successRatePerTaskPosition && (
              <Skeleton className="w-[100%] h-[150px]" />
            )) ||
              (successRatePerTaskPosition && (
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart
                    width={730}
                    height={250}
                    data={successRatePerTaskPosition}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#22c55e"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22c55e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="task_position" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="success_rate"
                      stroke="#22c55e"
                      fillOpacity={1}
                      fill="url(#colorUv)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionsDataviz;
