"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogContent,
  Dialog,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectValue, SelectTrigger, SelectItem, SelectContent, Select } from "@/components/ui/select"
import { useCookies } from 'react-cookie';

export function CreateIssueForm({ projectId }: { projectId: number | string }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MAJOR');
  const [cookies] = useCookies(['memberId']);
  const [isDialogOpen, setIsDialogOpen] = useState(false); //추가

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch(`https://swe.mldljyh.tech/api/projects/${projectId}/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, description, priority }),
        credentials: 'include', 
      });

      if (response.ok) {
        alert('Issue created successfully!');
        setTitle('');
        setDescription('');
        setPriority('MAJOR');
        setIsDialogOpen(false); //팝업 닫기
        window.location.reload(); //화면 새로고침
      } else {
        alert('Failed to create issue.');
      }
    } catch (error) {
      console.error('Error creating issue:', error);
      alert('An error occurred while creating the issue.');
    }
  };
  
//<Dialog defaultOpen> 변경
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button >Create New Issue</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Issue</DialogTitle>
          <DialogDescription>Fill out the details below to create a new issue.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title for the issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                className="min-h-[100px]"
                id="description"
                placeholder="Provide a detailed description of the issue"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIVIAL">Trivial</SelectItem>
                  <SelectItem value="MINOR">Minor</SelectItem>
                  <SelectItem value="MAJOR">Major</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="BLOCKER">Blocker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create Issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}