"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PaginationPrevious,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
  PaginationNext,
  PaginationContent,
  Pagination,
} from "@/components/ui/pagination";
import { AddUserForm } from "./add-user_form";
import { CreateProjectPage } from "./create-project_page";
import { useCookies } from "react-cookie";
import { useRouter } from "next/navigation";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import Image from "next/image";

type Project = {
  id: number;
  name: string;
};

export function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<any>(null); // 현재 로그인한 사용자 정보 5/24
  const [cookies, removeCookie] = useCookies(["jwt"]);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showCreateProjectPage, setShowCreateProjectPage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
    fetchCurrentUser();
  }, []);

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
        // 사용자 정보 처리
      } else {
        throw new Error("사용자 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("사용자 정보 불러오기 실패:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("https://swe.mldljyh.tech/api/projects", {
        credentials: "include", // 쿠키를 포함하도록 설정
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleMyPageButtonClick = () => {
    router.push("/my-page"); // 절대 경로 사용
  };

  const handleLogout = () => {
    removeCookie("memberId", { path: "/" });
    router.push("/"); // 로그아웃 후 로그인 페이지로 이동
  };

  const handleDeleteProject = async (projectId: number) => {
    // 5/24
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
        router.push("/project-list");
        router.refresh();
      } else {
        console.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <>
      <style jsx global>{`
        body,
        html {
          background-color: white;
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
      `}</style>

      <header className="flex items-center justify-between px-4 py-3 border-b bg-white dark:border-gray-800">
        <Link
          className="flex items-center ml-0.5 gap-2 text-xl font-semibold w-72"
          href="#"
        >
          <div className="w-72 h-6 whitespace-nowrap">
            Issue Management System
          </div>
          <span className="sr-only">Issue Management System</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowAddUserForm(true)}>Add User</Button>
          <Button
            variant="outline"
            onClick={() => setShowCreateProjectPage(true)}
          >
            Create Project
          </Button>
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
          </Button>
        </div>
      </header>
      <main className="container mx-auto py-8 px-4 md:px-6 max-w-7xl min-h-screen bg-white">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Projects</h1>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                  Project Name
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project: Project) => (
                <tr
                  key={project.id}
                  className="border-b dark:border-gray-700 bg-white"
                >
                  <td className="px-4 py-3 font-medium">
                    <Link
                      className="hover:underline"
                      href={`/project/${project.id}`}
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user && user.role === "ADMIN" && (
                      <DeleteConfirmDialog
                        trigger={
                          <Button
                            size="sm"
                            variant="destructive"
                            className="mr-2"
                          >
                            Delete
                          </Button>
                        }
                        title="Delete Project"
                        description="Are you sure you want to delete this project?"
                        onConfirm={() => handleDeleteProject(project.id)}
                      />
                    )}
                    <Button
                      size="sm"
                      onClick={() => router.push(`/project/${project.id}`)}
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      {showAddUserForm && (
        <AddUserForm onClose={() => setShowAddUserForm(false)} />
      )}
      {showCreateProjectPage && (
        <CreateProjectPage onClose={() => setShowCreateProjectPage(false)} />
      )}
    </>
  );
}

function FrameIcon(props: any) {
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
      <line x1="22" x2="2" y1="6" y2="6" />
      <line x1="22" x2="2" y1="18" y2="18" />
      <line x1="6" x2="6" y1="2" y2="22" />
      <line x1="18" x2="18" y1="2" y2="22" />
    </svg>
  );
}
