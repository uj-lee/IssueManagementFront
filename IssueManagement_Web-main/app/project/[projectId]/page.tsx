"use client";
import React, { useCallback, useState, useEffect } from "react";
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
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { CreateIssueForm } from "@/components/create-issue_form";
import { useRouter, useParams } from "next/navigation";
import { useCookies } from "react-cookie";
import Image from "next/image";
import CommentDialog from "@/components/commentDialog";
import StatisticsDialog from "@/components/issue-statistics";
import Reports from "@/components/reports";
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
  const [cookies, removeCookie] = useCookies(["jwt", "memberId"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
  const [filterAssignee, setFilterAssignee] = useState(false);
  const [filterReporter, setFilterReporter] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isNLSearched, setIsNLSearched] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchIssues();
      fetchCurrentUser();
    }
  }, [projectId, searchQuery, selectedStatus, filterAssignee, filterReporter]);
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

  const handleSearch = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.startsWith("/ai ") && query.endsWith("/")) {
      // 자연어 검색 처리
      const userMessage = query.slice(4).trim().slice(0, -1).trim(); // "/ai " 이후의 문자열 추출 및 마지막 '/' 제거
      setIsNLSearched(true);  // 자연어 검색 상태 설정
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
      } finally {
        setIsNLSearched(false);  // 기존 검색으로 전환 시 자연어 검색 상태 해제
      }
    } else {
      // 기존 검색 로직 유지
      setIsNLSearched(false);  // 기존 검색으로 전환 시 자연어 검색 상태 해제
      filterIssues();
    }
  };
  

  const filterIssues = useCallback((issues = allIssues) => {
    if (isNLSearched) return;
    const filtered = issues.filter((issue) => {
      const matchesTitle = issue.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus ? issue.status === selectedStatus : true;
      const matchesAssignee = filterAssignee ? issue.assigneeUsername === user?.username : true;
      const matchesReporter = filterReporter ? issue.reporterUsername === user?.username : true;
      return matchesTitle && matchesStatus && matchesAssignee && matchesReporter;
    });
    setFilteredIssues(filtered);
  }, [allIssues, searchQuery, selectedStatus, filterAssignee, filterReporter]);

  const handleStatusClick = (status: Status | null) => {
    setSelectedStatus(status);
    filterIssues(allIssues);
    setDropdownOpen(false); // 드롭다운 닫기
  };

  const handleAssigneeFilterClick = () => {
    setFilterAssignee((prev) => !prev);
  };
  
  const handleReporterFilterClick = () => {
    setFilterReporter(!filterReporter);
  };


  const handleLogout = () => {
    removeCookie("memberId", { path: "/" });
    router.push("/"); // 로그아웃 후 로그인 페이지로 이동
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
          <div className="flex items-center gap-2">
            <Button className="ml-auto" variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
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
                  <StatisticsDialog
                    projectName={
                      Array.isArray(projectId) ? projectId[0] : projectId
                    }
                  />
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>
                    <div className="relative inline-block text-left">
                      <div className="flex items-center">
                        <p className="mr-2">Status</p>
                        <Button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {`${selectedStatus || "All"}`}
                          <svg
                            className="ml-1 h-4 w-4"
                            xmlns="https://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Button>
                      </div>
                      {dropdownOpen && (
                        <div
                          className="origin-top-right absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                          role="menu"
                          aria-orientation="vertical"
                          aria-labelledby="options-menu"
                        >
                          <div className="py-1" role="none">
                            {['NEW', 'ASSIGNED', 'FIXED', 'RESOLVED', 'CLOSED', 'REOPENED'].map((status) => (
                              <a
                                key={status}
                                onClick={() => handleStatusClick(status as Status)}
                                className={`${
                                  selectedStatus === status ? 'bg-blue-500 text-white' : 'text-gray-700'
                                } block px-4 py-2 text-sm cursor-pointer hover:bg-gray-100`}
                                role="menuitem"
                              >
                                {status}
                              </a>
                            ))}
                            <a
                              onClick={() => handleStatusClick(null)}
                              className="text-gray-700 block px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                              role="menuitem"
                            >
                              All
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>
                  <div className="flex items-center">
                    <span>Assignee</span>
                    <Button
                      onClick={handleAssigneeFilterClick}
                      className={`ml-2 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        filterAssignee ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500'
                      }`}
                    >
                      me
                    </Button>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">
                    <span>Reporter</span>
                    <Button
                      onClick={handleReporterFilterClick}
                      className={`ml-2 inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        filterReporter ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50 focus:ring-indigo-500'
                      }`}
                    >
                      me
                    </Button>
                  </div>
                </TableHead>
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
                          projectId={
                            Array.isArray(projectId) ? projectId[0] : projectId
                          }
                          issueId={issue.id.toString()}
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
                   {filteredIssues.length < 4 && (
                    <tr>
                      <td colSpan={5}>
                        <div style={{ height: '200px' }}></div>
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="reports">
            <Reports
              projectId={Array.isArray(projectId) ? projectId[0] : projectId}
            />
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
      xmlns="https://www.w3.org/2000/svg"
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
      xmlns="https://www.w3.org/2000/svg"
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
