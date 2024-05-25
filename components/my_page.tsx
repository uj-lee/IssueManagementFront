"use client";
import React, { useState, useEffect } from 'react';
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import { useCookies } from 'react-cookie';
import { useRouter } from 'next/navigation';

type Role = 'ADMIN' | 'PL' | 'DEV' | 'TESTER';
type Status = 'NEW' | 'ASSIGNED' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
type User = {
    id: number;
    username: string;
    role: Role;
};

type Issue = {
    id: number;
    title: string;
    assignee: User;
    project: Project;
    status: Status;
  };
  
  type Project = {
    id: number;
    name: string;
    issues: Issue[];
  };

export function MyPage() {
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<Role | ''>('');
    //const [issues, setIssues] = useState<Issue[]>([]); 모든 이슈
    const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
    const [resolvedIssues, setResolvedIssues] = useState<Issue[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [cookies] = useCookies(['memberId']);
    const router = useRouter();
  
    // 전체 사용자 목록에서 현재 로그인한 사용자 정보 불러오기
    useEffect(() => {
      console.log('쿠키에 저장된 memberId:', cookies.memberId);

      const fetchUsers = async () => {
        try {
          const response = await fetch('https://swe.mldljyh.tech/api/users', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
  
          if (response.ok) {
            const devUsers: User[] = await response.json();
            console.log('API에서 반환된 사용자 목록:', devUsers);

            const currentUser = devUsers.find((user: User) => user.id === Number(cookies.memberId));
            if (currentUser) {
              setUsername(currentUser.username);
              setRole(currentUser.role);
            } else {
              alert('현재 로그인한 사용자를 찾을 수 없습니다.');
            }
          } else if (response.status === 401) {
            throw new Error('인증되지 않은 사용자입니다.');
          } else if (response.status === 404) {
            throw new Error('사용자 목록을 찾을 수 없습니다.');
          } else {
            throw new Error('목록 조회에 실패했습니다.');
          }
        } catch (error) {
            console.error('사용자 정보를 가져오는 중 오류 발생:', error);
            alert('사용자 정보를 가져오는 중 오류가 발생했습니다.');
        }
      };

      const fetchProjectsAndIssues = async () => {
        try {
          const response = await fetch('https://swe.mldljyh.tech/api/projects', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
  
          if (response.ok) {
            const projects: Project[] = await response.json();
            console.log('API에서 반환된 프로젝트 목록:', projects);
  
            //const allIssues: Issue[] = []; 모든 이슈
            const allAssignedIssues: Issue[] = [];
            const allResolvedIssues: Issue[] = [];
            const userProjects = new Set<Project>();
  
            for (const project of projects) {
              const issueResponse = await fetch(`https://swe.mldljyh.tech/api/projects/${project.id}/issues`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
  
              if (issueResponse.ok) {
                const projectIssues: Issue[] = await issueResponse.json();
                const userAssignedIssues = projectIssues.filter(issue => issue.assignee && issue.assignee.id === Number(cookies.memberId));
                const userAssignedIssuesFiltered = userAssignedIssues.filter(issue => issue.status === 'ASSIGNED');
                const userResolvedIssuesFiltered = userAssignedIssues.filter(issue => issue.status !== 'ASSIGNED');
                //allIssues.push(...userAssignedIssues); 모든 이슈

                allAssignedIssues.push(...userAssignedIssuesFiltered);
                allResolvedIssues.push(...userResolvedIssuesFiltered);

                if (userAssignedIssues.length > 0) {
                  userProjects.add(project);
                }
              } else {
                console.error(`Failed to fetch issues for project ${project.id}`);
              }
            }
  
            //setIssues(allIssues); 모든 이슈
            setAssignedIssues(allAssignedIssues);
            setResolvedIssues(allResolvedIssues);
            setProjects(Array.from(userProjects));
          } else {
            throw new Error('프로젝트 목록을 가져오는데 실패했습니다.');
          }
        } catch (error) {
          console.error('프로젝트 및 이슈 정보를 가져오는 중 오류 발생:', error);
          alert('프로젝트 및 이슈 정보를 가져오는 중 오류가 발생했습니다.');
        }
      };

      fetchUsers();
    fetchProjectsAndIssues();
  }, [cookies.memberId]);

      const displayRole = () => {
        switch (role) {
          case 'ADMIN':
            return 'Admin';
          case 'PL':
            return 'Product Lead';
          case 'DEV':
            return 'Developer';
          case 'TESTER':
            return 'Tester';
          default:
            return role;
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
        <div className="grid grid-cols-3 gap-4 w-full">
        <Card>
            <CardHeader>
              <CardTitle>My Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {projects.map(project => (
                  <div key={project.id} className="border-b pb-2 mb-4">
                    <p className="font-medium mb-1">{project.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Assigned Issue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {assignedIssues.map(issue => (
                  <div key={issue.id} className="border-b pb-2 mb-2">
                    <p className="font-medium">{issue.title}</p>
                    <p className="text-sm text-gray-500">{issue.project.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fixed Issue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid gap-2">
                {resolvedIssues.map(issue => (
                  <div key={issue.id} className="border-b pb-2 mb-2">
                    <p className="font-medium">{issue.title}</p>
                    <p className="text-sm text-gray-500">{issue.project.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t shrink-0 md:px-6 z-10 flex justify-end">
        <Button className="ml-auto" variant="outline" onClick={() => router.back()}>
          Back to Page
        </Button>
      </footer>
    </div>
  );
}