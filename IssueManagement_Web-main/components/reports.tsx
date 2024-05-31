"use client";
import React, { useState, useEffect } from "react";
import {
  CardTitle,
  CardHeader,
  CardContent,
  Card,
  CardDescription,
} from "@/components/ui/card";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import CurrentDate from "./ui/current_date";

type Priority = "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "TRIVIAL";
type Status = "NEW" | "ASSIGNED" | "FIXED" | "RESOLVED" | "CLOSED" | "REOPENED";
type Role = "ADMIN" | "PL" | "DEV" | "TESTER";

type User = {
  id: number;
  username: string;
  password: string;
  role: Role;
};

type Comment = {
  id: number;
  content: string;
  author: User;
  createdDate: string; // ISO 포맷 문자열로 가정
  issue: Issue; // 순환 참조를 피하기 위해 필요시 빼고 정의 가능
};

type Project = {
  id: number;
  name: string;
  issue: Issue[];
};

type Issue = {
  id: number;
  title: string;
  description: string;
  reporterUsername: String;
  reportedDate: string; // ISO 포맷 문자열로 가정
  fixerUsername: String;
  assigneeUsername: String;
  priority: Priority;
  status: Status;
  comments: Comment[];
  project: Project;
};

interface ReportsProps {
  projectId: string;
}

interface Datum {
  id: string;
  value: number;
}

const Reports: React.FC<ReportsProps> = ({ projectId }) => {
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [allIssues,] = useState<Issue[]>([]);
  const [issuesPerMonth, setIssuesPerMonth] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [issueCount, setIssueCount] = useState(0); // issue count state
  const [issuesPerDay, setIssuesPerDay] = useState<any[]>([]); // state to store issues for last 30 days
  const [majorIssuesPerDay, setMajorIssuesPerDay] = useState<any[]>([]); // state to store major issues for last 7 days
  const [minorIssuesPerDay, setMinorIssuesPerDay] = useState<any[]>([]); // state to store minor issues for last 7 days
  const [issuesByPriority, setIssuesByPriority] = useState<any[]>([]); // state to store issues by priority

  useEffect(() => {
    if (projectId) {
      fetchIssuesPerMonth();
      fetchIssuesPerDay();
      fetchIssuesPerDayAndPriority("MAJOR", setMajorIssuesPerDay);
      fetchIssuesPerDayAndPriority("MINOR", setMinorIssuesPerDay);
      fetchIssuesPerPriorityInMonth(); 
    }
  }, [projectId, searchQuery]);

  const fetchIssuesPerMonth = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/statistics/issuesPerMonth`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        const formattedData = Object.entries(data).map(([month, count]) => ({
          x: month,
          y: count,
        }));

        const lastMonthCount = (Object.values(data).pop() as number) || 0; // undefined일 경우 기본값 0

        setIssueCount(lastMonthCount); // 마지막 달의 count를 issueCount로 설정
        setIssuesPerMonth(formattedData);
      } else {
        console.error("Failed to fetch issue statistics");
      }
    } catch (error) {
      console.error("Error fetching issue statistics:", error);
    }
  };
  
  const fetchIssuesPerDay = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/statistics/issuesPerDayInMonth`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        const formattedData = Object.entries(data).map(([day, count]) => ({
          x: day, 
          y: count,
        }));
        setIssuesPerDay(formattedData);
      } else {
        console.error("Failed to fetch issues per day");
      }
    } catch (error) {
      console.error("Error fetching issues per day:", error);
    }
  };

  const fetchIssuesPerDayAndPriority = async (
    priority: string,
    setData: (data: any[]) => void
  ) => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/statistics/issuesPerDayAndPriorityInWeek/${priority}`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        const formattedData = Object.entries(data).map(([day, count]) => ({
          x: day,
          y: count,
        }));
        setData(formattedData); 
      } else {
        console.error(`Failed to fetch ${priority} issues per day`);
      }
    } catch (error) {
      console.error(
        `Error fetching ${priority} issues per day:`,
        error
      );
    }
  };


  const fetchIssuesPerPriorityInMonth = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/statistics/issuesPerPriorityInMonth`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        const formattedData = Object.entries(data)
          .map(([priority, count]) => ({
            id: priority,
            label: priority,
            value: count,
          }))
          .filter((item) => (item.value as number) > 0); 
        setIssuesByPriority(formattedData);
      } else {
        console.error("Failed to fetch issues by priority");
      }
    } catch (error) {
      console.error("Error fetching issues by priority:", error);
    }
  };

  const priorityColorMap: { [key in Priority]: string } = {
    BLOCKER: "#9CA3AF",
    CRITICAL: "#EF4444",
    MAJOR: "#4E80EE",
    MINOR: "#E1B53F",
    TRIVIAL: "#7DD3FC",
  };

  const filterIssues = (issues = allIssues) => {
    const filtered = issues.filter((issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredIssues(filtered);
  };

  const getDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    const format = (date: Date) =>
      date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
    return `${format(startDate)} - ${format(endDate)}`;
  };

  return (
    <div>
      <div>
        <div>
          <div className="font-semibold text-2xl m-4">Issue Trends</div>
          <div className="m-4">Here are the Issue Trends for this project.</div>
        </div>
        <div>
          <div className="space-y-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex gap-2">
                  <div className="rounded-md bg-gray-500 px-3 py-1 text-xs font-medium text-white">
                    TODAY
                  </div>
                  <div>
                    <CurrentDate />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  style={{ width: "100%", height: "400px", marginTop: "20px" }}
                >
                  {issuesPerDay.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-xl">
                      No Data
                    </div>
                  ) : (
                    <LineChart data={issuesPerDay} className="w-full h-96" />
                  )}
                </div>
                <div className="flex justify-end items-center mt-4 pt-6 border-t gap-4">
                  <div className="text-xl font-medium">
                    Average number of issues per day:
                  </div>
                  <div
                    className="pr-2 text-4xl font-semibold"
                    style={{ minWidth: "50px" }}
                  >
                    {(issueCount / 30).toFixed(1)}
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <span className="text-blue-500">Major</span> Issues
                      Created Daily
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      style={{
                        width: "100%",
                        height: "400px",
                        marginTop: "20px",
                      }}
                    >
                      {majorIssuesPerDay.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-xl">
                          No Data
                        </div>
                      ) : (
                        <LineChart
                          data={majorIssuesPerDay}
                          className="w-full h-96"
                          color="#4E80EE"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <span className="text-yellow-500">Minor</span> Issues
                      Created Daily
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      style={{
                        width: "100%",
                        height: "400px",
                        marginTop: "20px",
                      }}
                    >
                      {minorIssuesPerDay.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-xl">
                          No Data
                        </div>
                      ) : (
                        <LineChart
                          data={minorIssuesPerDay}
                          className="w-full h-96"
                          color="#E1B53F"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Issues per Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      style={{
                        width: "100%",
                        height: "400px",
                        marginTop: "20px",
                      }}
                    >
                      <LineChart
                        className="w-full h-96"
                        data={issuesPerMonth}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Issues by priority</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {getDateRange()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      style={{
                        width: "100%",
                        height: "400px",
                        marginTop: "20px",
                      }}
                    >
                      {issuesByPriority.length === 0 ? (
                        <div className="flex justify-center items-center h-full text-xl">
                          No Data
                        </div>
                      ) : (
                        <PieChart
                          data={issuesByPriority}
                          className="w-full h-96"
                          colors={(d: Datum) =>
                            priorityColorMap[d.id as Priority]
                          }
                          innerRadius={0.5}
                          padAngle={1}
                          tooltip={({ datum: { id, value, color } }: any) => (
                            <div
                              style={{
                                padding: "12px 16px",
                                background: "#fff",
                                border: `1px solid ${color}`,
                                borderRadius: "4px",
                                boxShadow: "0 3px 9px rgba(0, 0, 0, 0.15)",
                              }}
                            >
                              <strong>{id}</strong>: {value}
                            </div>
                          )}
                          enableArcLabels={false} // arcLabel 사용 안 함
                          enableArcLinkLabels={false} // arcLinkLabels 사용 안 함
                        />
                      )}
                    </div>
                    <div className="flex justify-center mt-4">
                      {Object.entries(priorityColorMap).map(
                        ([priority, color]) => (
                          <div
                            key={priority}
                            className="flex items-center mx-2"
                          >
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                backgroundColor: color,
                                marginRight: "6px",
                              }}
                            ></div>
                            <span className="text-xs">{priority}</span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LineChartProps {
  data: { x: string; y: number }[];
  className?: string;
  color?: string;
}

function LineChart({ data, className, color }: LineChartProps) {
  return (
    <div className={className}>
      <ResponsiveLine
        data={[
          {
            id: "Issues",
            data,
          },
        ]}
        margin={{ top: 10, right: 10, bottom: 50, left: 40 }}
        xScale={{
          type: "point",
        }}
        yScale={{
          type: "linear",
        }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 16,
          tickRotation: -45,
          legendOffset: 36,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 0,
          tickValues: 5,
          tickPadding: 16,
        }}
        colors={[color || "#2563eb"]}
        pointSize={6}
        useMesh={true}
        gridYValues={6}
        theme={{
          tooltip: {
            chip: {
              borderRadius: "9999px",
            },
            container: {
              fontSize: "12px",
              textTransform: "capitalize",
              borderRadius: "6px",
            },
          },
          grid: {
            line: {
              stroke: "#f3f4f6",
            },
          },
        }}
        role="application"
      />
    </div>
  );
}

function PieChart({
  data,
  className,
  colors,
  innerRadius,
  padAngle,
  enableArcLabels,
  enableArcLinkLabels,
}: any) {
  return (
    <div className={className}>
      <ResponsivePie
        data={data}
        sortByValue
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        cornerRadius={0}
        padAngle={padAngle}
        innerRadius={innerRadius}
        borderWidth={1}
        borderColor={"#ffffff"}
        colors={colors}
        theme={{
          labels: {
            text: {
              fontSize: "18px",
            },
          },
          tooltip: {
            chip: {
              borderRadius: "9999px",
            },
            container: {
              fontSize: "12px",
              textTransform: "capitalize",
              borderRadius: "6px",
            },
          },
        }}
        tooltip={({ datum }) => (
          <div>
            <strong>{datum.label}:</strong> {datum.value}
          </div>
        )}
        enableArcLabels={enableArcLabels}
        enableArcLinkLabels={enableArcLinkLabels}
        role="application"
      />
    </div>
  );
}

export default Reports;