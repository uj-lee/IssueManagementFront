"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TabsTrigger, TabsList, TabsContent, Tabs } from "@/components/ui/tabs";
import {
  TableHead,
  TableRow,
  TableHeader,
  TableCell,
  TableBody,
  Table,
} from "@/components/ui/table";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCookies } from "react-cookie";
import { useRouter, useParams } from "next/navigation";
import { DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter, DialogContent, Dialog } from "@/components/ui/dialog";

type Priority = "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "TRIVIAL";
type Role = "ADMIN" | "PL" | "DEV" | "TESTER";
type Status = "NEW" | "ASSIGNED" | "FIXED" | "RESOLVED" | "CLOSED" | "REOPENED";

type User = {
  id: number;
  username: string;
  password: string;
  role: Role;
};

type Issue = {
  id: number;
  title: string;
  reporterUsername: String;
  reportedDate: string; // ISO 포맷 문자열로 가정
  fixerUsername: String;
  assigneeUsername: String;
  priority: Priority;
  status: Status;
  comments: Comment[];
  project: Project;
};

type Project = {
  id: number;
  name: string;
};

export function MyPage() {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const params = useParams(); // Use useParams to get projectId
  const projectId = params.projectId;
  //const [issues, setIssues] = useState<Issue[]>([]); 모든 이슈
  const [cookies] = useCookies(["jwt"]);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dialogOpen, setDialogOpen] = useState<number | null>(null);

  // 전체 사용자 목록에서 현재 로그인한 사용자 정보 불러오기
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("https://swe.mldljyh.tech/api/users", {
          method: "GET",
          credentials: "include", // 쿠키 포함
        });
  
        if (response.ok) {
          const user = await response.json();
          setUser(user);
          setUsername(user.username);
          setRole(user.role);
          console.log("사용자 정보:", user);
          setIsLoading(false);  // 로딩 상태 업데이트
          fetchProjectsAndIssues(user);
        } else {
          throw new Error("사용자 정보를 불러올 수 없습니다.");
        }
      } catch (error) {
        console.error("사용자 정보 불러오기 실패:", error);
        setIsLoading(false);  // 에러 발생 시에도 로딩 상태 업데이트
      }
    };
  
    const fetchProjectsAndIssues = async (user: User) => {
      try {
        const projectResponse = await fetch("https://swe.mldljyh.tech/api/projects", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
  
        if (projectResponse.ok) {
          const projects: Project[] = await projectResponse.json();
          console.log("API에서 반환된 프로젝트 목록:", projects);

          setProjects(projects);
  
          const issuePromises = projects.map(project => 
            fetch(`https://swe.mldljyh.tech/api/projects/${project.id}/issues`, {
              method: "GET",
              credentials: "include",
            })
          );
  
          const issueResponses = await Promise.all(issuePromises);
          const allIssues: Issue[] = [];
  
          for (let i = 0; i < issueResponses.length; i++) {
            if (issueResponses[i].ok) {
              const projectIssues: Issue[] = await issueResponses[i].json();
              console.log(`Project ${projects[i].id}의 이슈 목록:`, projectIssues);
  
              const userIssues = projectIssues.map(issue => ({
                ...issue,
                project: { id: projects[i].id, name: projects[i].name }
              }));

              allIssues.push(...userIssues);
            } else {
              console.error(`Failed to fetch issues for project ${projects[i].id}`);
            }
          }
  
          console.log("All Issues:", allIssues);
  
          setAllIssues(allIssues);
          setFilteredIssues(allIssues);
        } else {
          throw new Error("프로젝트 목록을 가져오는데 실패했습니다.");
        }
      } catch (error) {
        console.error("프로젝트 및 이슈 정보를 가져오는 중 오류 발생:", error);
        alert("프로젝트 및 이슈 정보를 가져오는 중 오류가 발생했습니다.");
      }
    };
  
    fetchCurrentUser();
  }, [cookies.jwt]);

  const displayRole = () => {
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "PL":
        return "Product Lead";
      case "DEV":
        return "Developer";
      case "TESTER":
        return "Tester";
      default:
        return role;
    }
  };

  const getGridClass = (role: string): string => {
    switch (role) {
      case "ADMIN":
        return "grid-cols-1";
      case "PL":
        return "grid-cols-3";
      case "DEV":
        return "grid-cols-2";
      case "TESTER":
        return "grid-cols-2";
      default:
        return "grid-cols-1";
    }
  };

  const tabsListClass = `grid w-full ${getGridClass(role)}`;

  if (isLoading) {
    return <div></div>;
  }
  
  const getDefaultTab = (role: string): string => {
    switch (role) {
      case "ADMIN":
        return "projects";
      case "PL":
        return "all-issues";
      case "DEV":
        return "assignee-issues";
      case "TESTER":
        return "reporter-issues";
      default:
        return "issues";
    }
  };
  
  const defaultTab = getDefaultTab(role);

  const handleDeleteProject = async (projectId: number) => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}`,
        {
          method: "DELETE",
          credentials: "include", // 쿠키를 포함하도록 설정
        }
      );
      if (response.ok) {
        setProjects(projects.filter((project) => project.id !== projectId));
        router.refresh();
      } else {
        console.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <main className="flex flex-col items-center space-y-4 w-full px-4 py-8 md:px-6 lg:px-8 mb-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">My Page</h1>
        </div>
        <div className="border-b-2 border-gray-300 mt-2 w-full"></div><br></br>
        <div className="flex items-center space-x-4">
        <Avatar className="w-28 h-28 border-4 border-gray-500 rounded-full">
            <AvatarImage alt="@shadcn" src="/placeholder-user.jpg" className="rounded-full" />
          </Avatar>
          <div className="text-center">
            <p className="text-m font-medium">User name</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{username}</p>
            <p className="text-m font-medium">Role</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{displayRole()}</p>
          </div>
        </div><br></br>
        <Tabs className="w-full" defaultValue={defaultTab}>
        <TabsList className={tabsListClass}>
        {role === "ADMIN" && (
              <>
                <TabsTrigger value="projects">Project Management</TabsTrigger>
              </>
            )}

        {role === "PL" && (
              <>
                <TabsTrigger value="all-issues">All Issues</TabsTrigger>
                <TabsTrigger value="status-new">New Issues</TabsTrigger>
                <TabsTrigger value="status-resolved">Resolved Issues</TabsTrigger>
              </>
            )}
            
        {role === "DEV" && (
              <>
                <TabsTrigger value="assignee-issues">My Issues</TabsTrigger>
                <TabsTrigger value="status-assigned">Assigned Issues</TabsTrigger>
              </>
            )}
        {role === "TESTER" && (
              <>
                <TabsTrigger value="reporter-issues">My Issues</TabsTrigger>
                <TabsTrigger value="status-fixed">Fixed Issues</TabsTrigger>
              </>
            )}
        </TabsList>
        <TabsContent value="projects">
        <div className="grid gap-4">
              <div className="flex items-center justify-between">
              </div>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead style={{ width: "200px" }}>Project ID</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead></TableHead>
              </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project: Project) => (
                    <TableRow key={project.id}>
                      <TableCell>#{project.id}</TableCell>
                      <TableCell>{project.name}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            className="mr-2"
                            onClick={() => router.push(`/project/${project.id}`)}
                          >
                            View issues
                          </Button>
                          <Dialog open={dialogOpen === project.id} onOpenChange={(isOpen) => setDialogOpen(isOpen ? project.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                Delete
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="mb-2">Delete Project</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete the project "{project.name}"?
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                              <Button variant="outline" onClick={() => setDialogOpen(null)}>
                                  No
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    handleDeleteProject(project.id);
                                    setDialogOpen(null);
                                  }}
                                >
                                  Yes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                      </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="all-issues">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
              </div>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Issue Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead></TableHead>
              </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>#{issue.project.id}</TableCell>
                      <TableCell>{issue.project.name}</TableCell>
                      <TableCell>#{issue.id}</TableCell>
                      <TableCell>{issue.title}</TableCell>
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
                        { (
                          <>
                            <span className="font-medium">
                              {issue.assigneeUsername}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        { (
                          <>
                            <span className="font-medium">
                              {issue.reporterUsername}
                            </span>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                          <Link
                            href={`/project/${issue.project.id}/issue/${issue.id}`}
                          >
                            <Button 
                              className="ml-auto"
                              variant="outline"
                            >  
                            Go issue details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="assignee-issues">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Issue ID</TableHead>
                    <TableHead>Issue Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                     {filteredIssues
                    .filter(issue => issue.assigneeUsername === username)
                    .map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>#{issue.project.id}</TableCell>
                        <TableCell>{issue.project.name}</TableCell>
                        <TableCell>#{issue.id}</TableCell>
                        <TableCell>{issue.title}</TableCell>
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
                          {(
                            <>
                              <span className="font-medium">
                                {issue.assigneeUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          {(
                            <>
                              <span className="font-medium">
                                {issue.reporterUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/project/${issue.project.id}/issue/${issue.id}`}
                          >
                            <Button
                              className="ml-auto"
                              variant="outline"
                            >
                              Go issue details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="reporter-issues">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project ID</TableHead>
                    <TableHead>Project Title</TableHead>
                    <TableHead>Issue ID</TableHead>
                    <TableHead>Issue Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues
                    .filter(issue => issue.reporterUsername === username)
                    .map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>#{issue.project.id}</TableCell>
                        <TableCell>{issue.project.name}</TableCell>
                        <TableCell>#{issue.id}</TableCell>
                        <TableCell>{issue.title}</TableCell>
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
                          {(
                            <>
                              <span className="font-medium">
                                {issue.assigneeUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          {(
                            <>
                              <span className="font-medium">
                                {issue.reporterUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/project/${issue.project.id}/issue/${issue.id}`}
                          >
                            <Button
                              className="ml-auto"
                              variant="outline"
                            >
                              Go issue details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="status-assigned">
          <div className="grid gap-4">
              <div className="flex items-center justify-between">
              </div>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Issue Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead></TableHead>
              </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues
                    .filter(issue => issue.assigneeUsername === username && issue.status === "ASSIGNED")
                    .map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>#{issue.project.id}</TableCell>
                        <TableCell>{issue.project.name}</TableCell>
                        <TableCell>#{issue.id}</TableCell>
                        <TableCell>{issue.title}</TableCell>
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
                          { (
                            <>
                              <span className="font-medium">
                                {issue.assigneeUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          { (
                            <>
                              <span className="font-medium">
                                {issue.reporterUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/project/${issue.project.id}/issue/${issue.id}`}
                          >
                            <Button 
                              className="ml-auto"
                              variant="outline"
                            >  
                            Go issue details
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="status-new">
          <div className="grid gap-4">
              <div className="flex items-center justify-between">
              </div>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Issue Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead></TableHead>
              </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues
                    .filter(issue => issue.status === "NEW")
                    .map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>#{issue.project.id}</TableCell>
                        <TableCell>{issue.project.name}</TableCell>
                        <TableCell>#{issue.id}</TableCell>
                        <TableCell>{issue.title}</TableCell>
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
                          { (
                            <>
                              <span className="font-medium">
                                {issue.assigneeUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          { (
                            <>
                              <span className="font-medium">
                                {issue.reporterUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/project/${issue.project.id}/issue/${issue.id}`}
                          >
                          <Button 
                            className="ml-auto"
                            variant="outline"
                          >  
                          Go issue details
                          </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="status-fixed">
          <div className="grid gap-4">
              <div className="flex items-center justify-between">
              </div>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Issue Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead></TableHead>
              </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues
                    .filter(issue => issue.reporterUsername === username && issue.status === "FIXED")
                    .map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>#{issue.project.id}</TableCell>
                        <TableCell>{issue.project.name}</TableCell>
                        <TableCell>#{issue.id}</TableCell>
                        <TableCell>{issue.title}</TableCell>
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
                          { (
                            <>
                              <span className="font-medium">
                                {issue.assigneeUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          { (
                            <>
                              <span className="font-medium">
                                {issue.reporterUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                        <Link
                            href={`/project/${issue.project.id}/issue/${issue.id}`}
                          >
                          <Button 
                            className="ml-auto"
                            variant="outline"
                          >  
                          Go issue details
                          </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          <TabsContent value="status-resolved">
          <div className="grid gap-4">
              <div className="flex items-center justify-between">
              </div>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Project Title</TableHead>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Issue Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead></TableHead>
              </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIssues
                    .filter(issue => issue.status === "RESOLVED")
                    .map((issue) => (
                      <TableRow key={issue.id}>
                        <TableCell>#{issue.project.id}</TableCell>
                        <TableCell>{issue.project.name}</TableCell>
                        <TableCell>#{issue.id}</TableCell>
                        <TableCell>{issue.title}</TableCell>
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
                          { (
                            <>
                              <span className="font-medium">
                                {issue.assigneeUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          { (
                            <>
                              <span className="font-medium">
                                {issue.reporterUsername}
                              </span>
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/project/${issue.project.id}/issue/${issue.id}`}
                          >
                          <Button 
                            className="ml-auto"
                            variant="outline"
                          >  
                          Go issue details
                          </Button>
                          </Link>
                          </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t shrink-0 md:px-6 z-10 flex justify-end">
        <Button
          className="ml-auto"
          variant="outline"
          onClick={() => router.back()}
        >
          Back to Page
        </Button>
      </footer>
    </div>
  )
};
