"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { useCookies } from "react-cookie";
import { useRouter, useParams } from "next/navigation";
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
  const router = useRouter();
  const params = useParams(); // Use useParams to get projectId
  const projectId = Array.isArray(params.projectId)
    ? params.projectId[0]
    : params.projectId;
  const issueId = params.issueId;
  const [cookies] = useCookies(["jwt"]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [issue, setIssue] = useState<any>(null);
  const [comments, setComments] = useState<Comment[][]>([]); // 각 이슈의 코멘트를 저장하는 배열
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [issueCount, setIssueCount] = useState(0); // issue count state
  const [closeIssueCount, setCloseIssueCount] = useState(0); // close issue count state
  const [assignedIssueCount, setAssignedIssueCount] = useState(0); // assigned issue count state
  const [resolvedIssueCount, setResolvedIssueCount] = useState(0); // resolved issue count state
  const [remainingIssueCount, setRemainingIssueCount] = useState(0); // remaining issue count state
  const [newIssueCount, setNewIssueCount] = useState(0); // new issue count state
  const [reopenedIssueCount, setReopenedIssueCount] = useState(0); // reopened issue count state
  const [unassignedIssueCount, setUnassignedIssueCount] = useState(0);
  const [weeklyIssues, setWeeklyIssues] = useState<SortedDataType[]>([]); // state to store weekly issues
  const [maxYValue, setMaxYValue] = useState<number>(0); // state to store max Y value
  const [assigneeIssueCount, setAssigneeIssueCount] = useState<any[]>([]); // state to store issue count by assignee
  const [topCommentIssues, setTopCommentIssues] = useState<any[]>([]); // state to store top comment issues

  useEffect(() => {
    if (projectId) {
      fetchIssues();
    }
  }, [projectId, searchQuery]);
  //console.log(projectId)

  const fetchIssues = async () => {
    try {
      const url = `https://swe.mldljyh.tech/api/projects/${projectId}/issues`;
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAllIssues(data);
        filterIssues(data); // 최초에 전체 이슈를 필터링합니다.
        setIssueCount(data.length);
        const assignedCount = data.filter(
          (issue: Issue) => issue.status === "ASSIGNED"
        ).length;
        setAssignedIssueCount(assignedCount); // assigned issue count state 업데이트
        const closedCount = data.filter(
          (issue: Issue) => issue.status === "CLOSED"
        ).length;
        const resolvedCount = data.filter(
          (issue: Issue) => issue.status === "RESOLVED"
        ).length;
        setResolvedIssueCount(resolvedCount); // resolved issue count state 업데이트
        setRemainingIssueCount(data.length - resolvedCount - closedCount); // remaining issue count state 업데이트
        const newCount = data.filter(
          (issue: Issue) => issue.status === "NEW"
        ).length;
        setNewIssueCount(newCount); // new issue count state 업데이트
        const reopenedCount = data.filter(
          (issue: Issue) => issue.status === "REOPENED"
        ).length;
        setReopenedIssueCount(reopenedCount); // reopened issue count state 업데이트
        setUnassignedIssueCount(newCount + reopenedCount);
        const { sortedData, maxYValue } = calculateWeeklyIssues(data); // calculate weekly issues
        setWeeklyIssues(sortedData);
        setMaxYValue(maxYValue);
        setAssigneeIssueCount(calculateAssigneeIssueCount(data)); // calculate assignee issue count
        // 각 이슈의 코멘트를 병렬로 가져오는 코드
        const commentPromises = data.map((issue: Issue) =>
          fetchComments(projectId, issue.id.toString())
        );
        const commentsData = await Promise.all(commentPromises);
        setComments(commentsData); // 코멘트 데이터를 상태로 저장

        setTopCommentIssues(calculateTopCommentIssues(data, commentsData)); // calculate top comment issues
      } else {
        throw new Error("Failed to fetch issues");
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  };

  const fetchComments = async (projectId: string, issueId: string) => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}/comments`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        return data; // 코멘트 데이터를 반환
      } else {
        throw new Error("댓글 목록을 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("댓글 목록 불러오기 실패:", error);
      return []; // 에러가 발생하면 빈 배열을 반환
    }
  };

  type WeeklyIssues = {
    [key: string]: {
      NEW: number;
      ASSIGNED: number;
      FIXED: number;
      RESOLVED: number;
      CLOSED: number;
      REOPENED: number;
    };
  };

  type SortedDataType = {
    day: string;
    NEW: number;
    ASSIGNED: number;
    FIXED: number;
    RESOLVED: number;
    CLOSED: number;
    REOPENED: number;
  };

  const calculateWeeklyIssues = (issues: Issue[]) => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const weeklyIssues = issues.filter((issue) => {
      const reportedDate = new Date(issue.reportedDate);
      return reportedDate >= weekAgo && reportedDate <= now;
    });

    const groupedByDay: WeeklyIssues = weeklyIssues.reduce(
      (acc: WeeklyIssues, issue: Issue) => {
        const day = new Date(issue.reportedDate).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          weekday: "short",
        });
        if (!acc[day]) {
          acc[day] = {
            NEW: 0,
            ASSIGNED: 0,
            FIXED: 0,
            RESOLVED: 0,
            CLOSED: 0,
            REOPENED: 0,
          };
        }
        acc[day][issue.status]++;
        return acc;
      },
      {} as WeeklyIssues
    );

    // 날짜 순으로 정렬 추가
    const sortedData: SortedDataType[] = Object.entries(groupedByDay)
      .map(([day, statuses]) => ({
        day,
        NEW: statuses.NEW,
        ASSIGNED: statuses.ASSIGNED,
        FIXED: statuses.FIXED,
        RESOLVED: statuses.RESOLVED,
        CLOSED: statuses.CLOSED,
        REOPENED: statuses.REOPENED,
      }))
      .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());

    const maxValues = sortedData.map((d) => {
      const values = Object.values(d).slice(1);
      return Math.max(...values.map((value) => value as number));
    });

    const maxYValue = Math.max(...maxValues) + 2; // 데이터의 최대값보다 큰 값

    return { sortedData, maxYValue };
  };

  const calculateAssigneeIssueCount = (issues: Issue[]) => {
    const assigneeIssueCount = issues.reduce(
      (
        acc: { [key: string]: { RESOLVED: number; CLOSED: number } },
        issue: Issue
      ) => {
        if (issue.status === "RESOLVED" || issue.status === "CLOSED") {
          const assignee = issue.assigneeUsername as string;
          if (!acc[assignee]) {
            acc[assignee] = { RESOLVED: 0, CLOSED: 0 };
          }
          acc[assignee][issue.status]++;
        }
        return acc;
      },
      {}
    );

    const assigneeArray = Object.entries(assigneeIssueCount).map(
      ([assignee, statuses]) => ({
        assignee,
        ...statuses,
      })
    );

    // 가장 많은 이슈를 처리한 상위 3명의 담당자 선택
    const top3Assignees = assigneeArray
      .sort((a, b) => b.RESOLVED + b.CLOSED - (a.RESOLVED + a.CLOSED))
      .slice(0, 3);

    return top3Assignees;
  };

  const calculateTopCommentIssues = (issues: Issue[], commentsData: any[]) => {
    const issuesWithComments = issues.map((issue, index) => ({
      ...issue,
      comments: commentsData[index] || [],
    }));

    const filteredIssues = issuesWithComments.filter(
      (issue) =>
        issue.status === "ASSIGNED" ||
        issue.status === "NEW" ||
        issue.status === "REOPENED" ||
        issue.status === "FIXED"
    );

    const issuesWithCommentCount = filteredIssues.map((issue) => ({
      title: issue.title,
      comments: issue.comments.length, // comments의 length를 확인
    }));

    // comment가 가장 많은 상위 3개의 이슈 선택
    const top3CommentIssues = issuesWithCommentCount
      .sort((a, b) => b.comments - a.comments)
      .slice(0, 3);

    return top3CommentIssues;
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
                      {remainingIssueCount}
                    </div>
                  </div>
                  <div className="p-2 text-center border-r">
                    <div className="text-sm text-gray-600 mb-2">
                      Resolved Issues
                    </div>
                    <div className="font-bold text-3xl">
                      {resolvedIssueCount}
                    </div>
                  </div>
                  <div className="p-2 text-center border-r">
                    <div className="text-sm text-gray-600 mb-2">
                      Assigned Issues
                    </div>
                    <div className="font-bold text-3xl">
                      {assignedIssueCount}
                    </div>
                  </div>
                  <div className="p-2 text-center border-r">
                    <div className="text-sm text-gray-600 mb-2">
                      Unassigned Issues
                    </div>
                    <div className="font-bold text-3xl">
                      {unassignedIssueCount}
                    </div>
                  </div>
                  <div className="p-2 text-center">
                    <div className="text-sm text-gray-600 mb-2">
                      Registered Issues
                    </div>
                    <div className="font-bold text-3xl">{issueCount}</div>
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
                            length: maxYValue + 3,
                          },
                          (_, i) => i * yTickUnit
                        ),
                      }}
                      gridYValues={Array.from(
                        {
                          length: maxYValue + 3,
                        },
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
                                      ...topCommentIssues.map((d) => d.comments)
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
                                    ...topCommentIssues.map((d) => d.comments)
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
