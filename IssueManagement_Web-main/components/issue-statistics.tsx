"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TabsTrigger, TabsList, TabsContent, Tabs } from "@/components/ui/tabs";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CardContent, Card, CardTitle, CardHeader } from "@/components/ui/card";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { CreateIssueForm } from "@/components/create-issue_form";
import { useRouter, useParams } from "next/navigation";
import { useCookies } from "react-cookie";
import Image from "next/image";
import CommentDialog from "@/components/commentDialog";
import StatisticsDialog from "@/components/issue-statistics";
import { Avatar } from "@radix-ui/react-avatar";
import debounce from "lodash/debounce";

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

export default function ProjectScreenPage() {
  const router = useRouter();
  const params = useParams(); // Use useParams to get projectId
  const projectId = params.projectId;
  //const [issues, setIssues] = useState<Issue[]>([]);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [cookies] = useCookies(["jwt"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [issuesPerMonth, setIssuesPerMonth] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchIssues();
      fetchIssueStatistics();
      fetchCurrentUser();
    }
  }, [projectId, searchQuery]);
  //console.log(projectId)

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("https://swe.mldljyh.tech/api/users", {
        method: "GET",
        credentials: "include", // 쿠키 포함
      });

      if (response.ok) {
        const user = await response.json();
        setUser(user);
        console.log("사용자 정보:", user);
      } else {
        throw new Error("사용자 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("사용자 정보 불러오기 실패:", error);
    }
  };

  const handleMyPageButtonClick = () => {
    router.push("/my-page"); // 절대 경로 사용
  };

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
      } else {
        throw new Error("Failed to fetch issues");
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    }
  };

  const fetchIssueStatistics = async () => {
    try {
      const response = await fetch(
        "https://swe.mldljyh.tech/api/statistics/issuesPerMonth",
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
        setIssuesPerMonth(formattedData);
      } else {
        console.error("Failed to fetch issue statistics");
      }
    } catch (error) {
      console.error("Error fetching issue statistics:", error);
    }
  };

  const handleSearch = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.startsWith("/ai ") && query.endsWith("/")) {
      // 자연어 검색 처리
      const userMessage = query.slice(4).trim().slice(0, -1).trim(); // "/ai " 이후의 문자열 추출 및 마지막 '/' 제거
      try {
        const response = await fetch(
          `https://swe.mldljyh.tech/api/projects/${projectId}/issues/searchbynl?userMessage=${userMessage}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          const data = await response.json();
          setFilteredIssues(data);
        } else {
          throw new Error("이슈 검색에 실패했습니다.");
        }
      } catch (error) {
        console.error("이슈 검색 실패:", error);
      }
    } else {
      // 기존 검색 로직 유지
      filterIssues();
    }
  };

  const filterIssues = (issues = allIssues) => {
    const filtered = issues.filter((issue) =>
      issue.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredIssues(filtered);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-white dark:bg-gray-900">
      <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
        <nav className="flex-col hidden gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
            href="#"
          >
            <Package2Icon className="w-6 h-6" />
            <span className="sr-only">Project Name</span>
          </Link>
          <Link className="font-bold" href="#">
            Issues
          </Link>
        </nav>
        <div className="flex items-center w-full gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <form
            className="flex-1 ml-auto sm:flex-initial"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
                placeholder="Search issues..."
                type="search"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
          </form>
          <Button
            className="rounded-full"
            size="icon"
            variant="ghost"
            onClick={handleMyPageButtonClick}
          >
            <Image
              alt="Avatar"
              className="rounded-full"
              height="32"
              src="/placeholder-user.jpg"
              style={{
                aspectRatio: "32/32",
                objectFit: "cover",
              }}
              width="32"
            />
            {/*<span className="sr-only">Toggle user menu</span>*/}
          </Button>
        </div>
      </header>
      <main
        className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10"
        style={{ minHeight: "calc(100vh - 5rem)", paddingBottom: "5rem" }}
      >
        <Tabs className="w-full" defaultValue="issues">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="issues">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <CreateIssueForm projectId={projectId as string} />
                  <StatisticsDialog projectId={projectId} />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Reporter</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>#{issue.id}</TableCell>
                      <TableCell>
                        <Link
                          className="font-medium"
                          href={`/project/${projectId}/issue/${issue.id}`}
                        >
                          {issue.title}
                        </Link>
                        <CommentDialog
                          projectId={projectId}
                          issueId={issue.id}
                          user={user}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            issue.status === "NEW"
                              ? "primary"
                              : issue.status === "ASSIGNED"
                              ? "warning"
                              : issue.status === "FIXED"
                              ? "fix"
                              : issue.status === "RESOLVED"
                              ? "success"
                              : issue.status === "CLOSED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {
                          <>
                            <span className="font-medium">
                              {issue.assigneeUsername}
                            </span>
                          </>
                        }
                      </TableCell>
                      <TableCell>
                        {
                          <>
                            <span className="font-medium">
                              {issue.reporterUsername}
                            </span>
                          </>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="reports">
            <div className="grid gap-8">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Issues per Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart className="aspect-[9/4]" data={issuesPerMonth} />
                  </CardContent>
                </Card>
                {/* TODO: Issue Resolution Time 구현 */}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {/* TODO: Issues by Assignee 구현 */}
                {/* TODO: Issues by Priority 구현 */}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t shrink-0 md:px-6 z-10 flex justify-end">
        <Button
          className="ml-auto"
          variant="outline"
          onClick={() => router.push("/project-list")}
        >
          Back to Projects
        </Button>
      </footer>
    </div>
  );
}

function BarChart(props: any) {
  return (
    <div {...props}>
      <ResponsiveBar
        data={[
          { name: "Jan", count: 111 },
          { name: "Feb", count: 157 },
          { name: "Mar", count: 129 },
          { name: "Apr", count: 150 },
          { name: "May", count: 119 },
          { name: "Jun", count: 72 },
        ]}
        keys={["count"]}
        indexBy="name"
        margin={{ top: 0, right: 0, bottom: 40, left: 40 }}
        padding={0.3}
        colors={["#2563eb"]}
        axisBottom={{
          tickSize: 0,
          tickPadding: 16,
        }}
        axisLeft={{
          tickSize: 0,
          tickValues: 4,
          tickPadding: 16,
        }}
        gridYValues={4}
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
        tooltipLabel={({ id }) => `${id}`}
        enableLabel={false}
        role="application"
        ariaLabel="A bar chart showing data"
      />
    </div>
  );
}

interface LineChartProps {
  data: { x: string; y: number }[];
  className?: string;
}

function LineChart({ data, className }: LineChartProps) {
  return (
    <div className={className}>
      <ResponsiveLine
        data={[
          {
            id: "Issues",
            data,
          },
        ]}
        margin={{ top: 10, right: 10, bottom: 40, left: 40 }}
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
        colors={["#2563eb"]}
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

function Package2Icon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  );
}

function PieChart(props: any) {
  return (
    <div {...props}>
      <ResponsivePie
        data={[
          { id: "Jan", value: 111 },
          { id: "Feb", value: 157 },
          { id: "Mar", value: 129 },
          { id: "Apr", value: 150 },
          { id: "May", value: 119 },
          { id: "Jun", value: 72 },
        ]}
        sortByValue
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        cornerRadius={0}
        padAngle={0}
        borderWidth={1}
        borderColor={"#ffffff"}
        enableArcLinkLabels={false}
        arcLabel={(d) => `${d.id}`}
        arcLabelsTextColor={"#ffffff"}
        arcLabelsRadiusOffset={0.65}
        colors={["#2563eb"]}
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
        role="application"
      />
    </div>
  );
}

function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
