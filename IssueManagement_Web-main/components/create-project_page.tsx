"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { DialogTrigger, DialogTitle, DialogHeader, DialogFooter, DialogContent, Dialog } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useCookies } from 'react-cookie';

interface CreateProjectPageProps {
  onClose: () => void;
}

export function CreateProjectPage({ onClose }: CreateProjectPageProps) {
  const [projectName, setProjectName] = useState('');
  const [cookies] = useCookies(['memberId']);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const response = await fetch('https://swe.mldljyh.tech/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: projectName }), // 'name' 필드 사용
        credentials: 'include', // 쿠키를 포함하도록 설정
      });

      if (response.ok) {
        alert('Project created successfully!');
        setProjectName(''); // 입력 필드 초기화
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to create project: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating project:', error);
      alert('An error occurred while creating the project.');
    }
  };
//<Dialog defaultOpen> 변경
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogTrigger asChild>
        <Button variant="outline">Create New Project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}> {/* 폼 추가 */}
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="project-name">
                Project Name
              </Label>
              <Input
                className="col-span-3"
                id="project-name"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
