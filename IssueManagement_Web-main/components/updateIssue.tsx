"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogContent,
  Dialog,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { useCookies } from "react-cookie";

interface EditIssueFormProps {
  projectId: number;
  issueId: number;
}

export function EditIssueForm({ projectId, issueId }: EditIssueFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MAJOR");
  const [cookies] = useCookies(["memberId"]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch the issue details when the component mounts
    const fetchIssueDetails = async () => {
      try {
        const response = await fetch(
          `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (response.ok) {
          const issue = await response.json();
          setTitle(issue.title);
          setDescription(issue.description);
          setPriority(issue.priority);
        } else {
          console.error("Failed to fetch issue details.");
        }
      } catch (error) {
        console.error("Error fetching issue details:", error);
      }
    };

    fetchIssueDetails();
  }, [projectId, issueId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const issueData = { title, description, priority };

    fetch(
      `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueData),
        credentials: "include",
      }
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status === 400) {
          throw new Error(
            "유효하지 않은 요청입니다. 이슈 제목을 입력했는지 확인하세요."
          );
        } else {
          throw new Error("이슈 수정에 실패했습니다.");
        }
      })
      .then((issue) => {
        console.log("이슈 수정 성공:", issue);
        alert("Issue updated successfully!");
        setIsDialogOpen(false);
        window.location.reload();
      })
      .catch((error) => {
        console.error("이슈 수정 실패:", error);
        alert(`An error occurred while updating the issue: ${error.message}`);
      });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="ml-2">
          Edit Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Issue</DialogTitle>
          <DialogDescription>
            Update the details below to edit the issue.
          </DialogDescription>
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
            <Button type="submit">Update Issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditIssueForm;
