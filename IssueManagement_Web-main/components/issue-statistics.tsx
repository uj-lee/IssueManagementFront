"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { useParams } from "next/navigation";
import { ResponsiveBar } from "@nivo/bar";
import CurrentDate from "./ui/current_date";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

interface StatisticsDialogProps {
  projectName: string;
}

const StatisticsDialog: React.FC<StatisticsDialogProps> = ({ projectName }) => {
  const params = useParams(); // Use useParams to get projectId
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [allIssues] = useState<Issue[]>([]);
  const [searchQuery] = useState("");
  const [issueStatistics, setIssueStatistics] = useState<any>({});
  const [weeklyIssues, setWeeklyIssues] = useState<any[]>([]); // state to store weekly issues
  const [assigneeIssueCount, setAssigneeIssueCount] = useState<any[]>([]); // state to store issue count by assignee
  const [topCommentIssues, setTopCommentIssues] = useState<any[]>([]); // state to store top comment issues

  useEffect(() => {
    if (projectId) {
      fetchIssueStatistics();
      fetchWeeklyIssues();
      fetchIssuesPerFixer();
      fetchTopCommentIssues();
    }
  }, [projectId, searchQuery]);
  //console.log(projectId)

  const fetchIssueStatistics = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/statistics/issueStatusCounts`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIssueStatistics(data);
      } else {
        console.error("Error fetching issue statistics");
      }
    } catch (error) {
      console.error("Error fetching issue statistics:", error);
    }
  };

  const fetchWeeklyIssues = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/statistics/issuesPerDayAndStatusInWeek`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        const sortedData = Object.entries(data)
          .map(([day, statuses]) => ({
            day,
            ...(statuses as object),
          }))
         setWeeklyIssues(sortedData);
      } else {
        console.error("Error fetching weekly issues");
      }
    } catch (error) {
      console.error("Error fetching weekly issues:", error);
    }
  };

  const fetchIssuesPerFixer = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/statistics/issuesPerFixer`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();

        const assigneeArray = Object.entries(data).map(
          ([assignee, statuses]) => ({
            assignee,
            ...(statuses as object),
          })
        );

        // 가장 많은 이슈를 처리한 상위 3명의 담당자 선택
        const top3Assignees = assigneeArray
          .slice(0, 3);
        setAssigneeIssueCount(top3Assignees);
      } else {
        console.error("Error fetching issues per fixer");
      }
    } catch (error) {
      console.error("Error fetching issues per fixer:", error);
    }
  };

  const fetchTopCommentIssues = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/statistics/issuesOrderByComments`,
        {
          method: "GET",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const top3CommentIssues = Object.entries(data)
          .map(([title, comments]) => ({
            title,
            comments,
          }))
          .slice(0, 3);
        setTopCommentIssues(top3CommentIssues);
      } else {
        console.error("Error fetching top comment issues");
      }
    } catch (error) {
      console.error("Error fetching top comment issues:", error);
    }
  };

  const statusColorMap: { [key in Status]: string } = {
    NEW: "#6C727F",
    ASSIGNED: "#E1B53F",
    FIXED: "#6466E9",
    RESOLVED: "#5EC26A",
    CLOSED: "#DC524C",
    REOPENED: "#9E5AEF",
  };

  const yTickUnit = 1; // y축 눈금 단위 설정

  const filterIssues = (issues = allIssues) => {
    const filtered = issues.filter((issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredIssues(filtered);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Issue Statistics</Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-screen">
        <DialogHeader>
          <DialogTitle>Issue Statistics</DialogTitle>
          <DialogDescription>
            Here are the Issue Statistics for this project.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[70vh] space-y-4">
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
                <div className="grid grid-cols-5 gap-2 mt-4">
                  <div className="p-2 text-center border-r">
                    <div className="text-sm text-gray-600 mb-2">
                      Remaining Issues
                    </div>
                    <div className="font-bold text-3xl">
                      {issueStatistics.REMAINING}
                    </div>
                  </div>
                  <div className="p-2 text-center border-r">
                    <div className="text-sm text-gray-600 mb-2">
                      Resolved Issues
                    </div>
                    <div className="font-bold text-3xl">
                      {issueStatistics.RESOLVED}
                    </div>
                  </div>
                  <div className="p-2 text-center border-r">
                    <div className="text-sm text-gray-600 mb-2">
                      Assigned Issues
                    </div>
                    <div className="font-bold text-3xl">
                      {issueStatistics.ASSIGNED}
                    </div>
                  </div>
                  <div className="p-2 text-center border-r">
                    <div className="text-sm text-gray-600 mb-2">
                      Unassigned Issues
                    </div>
                    <div className="font-bold text-3xl">
                      {issueStatistics.UNASSIGNED}
                    </div>
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Registered Issues
                    </div>
                    <div className="font-bold text-3xl">
                      {issueStatistics["Registered Issues"]}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Weekly Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weeklyIssues.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-xl">
                    No Data
                  </div>
                ) : (
                  <div
                    style={{ width: "auto", height: "400px", margin: "0 auto" }}
                  >
                    <BarChart
                      data={weeklyIssues}
                      keys={[
                        "NEW",
                        "ASSIGNED",
                        "FIXED",
                        "RESOLVED",
                        "CLOSED",
                        "REOPENED",
                      ]}
                      indexBy="day"
                      margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
                      padding={0.3}
                      colors={({ id }: { id: string }) =>
                        statusColorMap[id as Status]
                      }
                      axisBottom={{
                        tickSize: 0,
                        tickPadding: 16,
                        format: (d: string) => d,
                        legendPosition: "middle",
                        legendOffset: 70,
                      }}
                      axisLeft={{
                        tickSize: 0,
                        tickPadding: 16,
                        tickValues: Array.from(
                          {
                            length:
                              Math.ceil(
                                Math.max(
                                  ...weeklyIssues.map((d) =>
                                    Math.max(
                                      d.NEW,
                                      d.ASSIGNED,
                                      d.FIXED,
                                      d.RESOLVED,
                                      d.CLOSED,
                                      d.REOPENED
                                    )
                                  )
                                )
                              ) + 2,
                          }, // 최대값을 포함하도록 tickValues 설정
                          (_, i) => i * yTickUnit
                        ),
                      }}
                      gridYValues={Array.from(
                        {
                          length:
                            Math.ceil(
                              Math.max(
                                ...weeklyIssues.map((d) =>
                                  Math.max(
                                    d.NEW,
                                    d.ASSIGNED,
                                    d.FIXED,
                                    d.RESOLVED,
                                    d.CLOSED,
                                    d.REOPENED
                                  )
                                )
                              )
                            ) + 2,
                        }, // 최대값을 포함하도록 gridYValues 설정
                        (_, i) => i * yTickUnit
                      )}
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
                      tooltipLabel={({ id }: { id: string }) => `${id}`} // 여기에 타입 지정
                      enableLabel={false}
                      role="application"
                      ariaLabel="A bar chart showing data"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Issue Resolution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {assigneeIssueCount.length === 0 ? (
                      <div className="flex justify-center items-center h-full text-xl">
                        No Data
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "auto",
                          height: "400px",
                          margin: "0 auto",
                        }}
                      >
                        <BarChart
                          data={assigneeIssueCount}
                          keys={["RESOLVED", "CLOSED"]}
                          indexBy="assignee"
                          margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
                          padding={0.3}
                          colors={({ id }: { id: string }) =>
                            id === "RESOLVED"
                              ? statusColorMap.RESOLVED
                              : statusColorMap.CLOSED
                          }
                          axisBottom={{
                            tickSize: 0,
                            tickPadding: 16,
                            format: (d: string) => d,
                            legendPosition: "middle",
                            legendOffset: 70,
                          }}
                          axisLeft={{
                            tickSize: 0,
                            tickPadding: 16,
                            tickValues: Array.from(
                              {
                                length:
                                  Math.ceil(
                                    Math.max(
                                      ...assigneeIssueCount.map((d) =>
                                        Math.max(d.RESOLVED, d.CLOSED)
                                      )
                                    )
                                  ) + 2,
                              }, // 최대값을 포함하도록 tickValues 설정
                              (_, i) => i * yTickUnit
                            ),
                          }}
                          gridYValues={Array.from(
                            {
                              length:
                                Math.ceil(
                                  Math.max(
                                    ...assigneeIssueCount.map((d) =>
                                      Math.max(d.RESOLVED, d.CLOSED)
                                    )
                                  )
                                ) + 2,
                            }, // 최대값을 포함하도록 gridYValues 설정
                            (_, i) => i * yTickUnit
                          )}
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
                          tooltipLabel={({ id }: { id: string }) => `${id}`} // 여기에 타입 지정
                          enableLabel={false}
                          role="application"
                          ariaLabel="A bar chart showing data"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Issues with many comments</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topCommentIssues.length === 0 ? (
                      <div className="flex justify-center items-center h-full text-xl">
                        No Data
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "auto",
                          height: "400px",
                          margin: "0 auto",
                        }}
                      >
                        <BarChart
                          data={topCommentIssues}
                          keys={["comments"]}
                          indexBy="title"
                          margin={{ top: 20, right: 30, bottom: 80, left: 60 }}
                          padding={0.3}
                          colors={() => "#0A56D0"}
                          axisBottom={{
                            tickSize: 0,
                            tickPadding: 16,
                            format: (d: string) => d,
                            legendPosition: "middle",
                            legendOffset: 70,
                          }}
                          axisLeft={{
                            tickSize: 0,
                            tickPadding: 16,
                            tickValues: Array.from(
                              {
                                length:
                                  Math.ceil(
                                    Math.max(
                                      ...topCommentIssues.map(
                                        (d) => d.comments
                                      )
                                    )
                                  ) + 2,
                              }, // 최대값을 포함하도록 tickValues 설정
                              (_, i) => i * yTickUnit
                            ),
                          }}
                          gridYValues={Array.from(
                            {
                              length:
                                Math.ceil(
                                  Math.max(
                                    ...topCommentIssues.map(
                                      (d) => d.comments
                                    )
                                  )
                                ) + 2,
                            }, // 최대값을 포함하도록 gridYValues 설정
                            (_, i) => i * yTickUnit
                          )}
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
                          tooltipLabel={({ id }: { id: string }) => `${id}`} // 여기에 타입 지정
                          enableLabel={false}
                          role="application"
                          ariaLabel="A bar chart showing data"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatisticsDialog;

function BarChart({
  data,
  keys,
  indexBy,
  margin,
  padding,
  colors,
  axisBottom,
  axisLeft,
  gridYValues,
  theme,
  tooltipLabel,
  enableLabel,
  role,
  ariaLabel,
}: any) {
  return (
    <div style={{ height: "400px" }}>
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={margin}
        padding={padding}
        colors={colors}
        axisBottom={axisBottom}
        axisLeft={axisLeft}
        gridYValues={gridYValues}
        theme={theme}
        tooltipLabel={tooltipLabel}
        enableLabel={enableLabel}
        role={role}
        ariaLabel={ariaLabel}
      />
    </div>
  );
}