"use client";
import React, { useState, useEffect } from "react";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CardTitle, CardHeader, CardContent, Card } from "@/components/ui/card";
import {
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Select,
} from "@/components/ui/select";
import { useCookies } from "react-cookie";
import { useRouter, useParams } from "next/navigation";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import { EditIssueForm } from "@/components/updateIssue";

export default function IssueDetailsPage() {
  const router = useRouter();
  const params = useParams(); // Use useParams to get projectId
  const projectId = params.projectId;
  const issueId = params.issueId;
  const [cookies] = useCookies(["memberId"]);
  const [issue, setIssue] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [status, setStatus] = useState<string | undefined>(undefined); // 상태 업데이트를 위한 상태
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined); // 담당자 업데이트를 위한 상태
  const [devUsers, setDevUsers] = useState<any[]>([]);
  const [recommendedAssignees, setRecommendedAssignees] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null); // 현재 로그인한 사용자 정보
  const [commentToDelete, setCommentToDelete] = useState<any>(null); // 삭제할 코멘트 상태
  const [commentToEdit, setCommentToEdit] = useState<any>(null); // 수정할 코멘트 상태
  const [editCommentContent, setEditCommentContent] = useState<string>(""); // 수정할 코멘트 내용 상태

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

  useEffect(() => {
    if (projectId && issueId) {
      fetchIssueDetails();
      fetchCurrentUser();
      fetchRecommendedAssignees();
      fetchDevUsers();
    }
  }, [projectId, issueId]);

  const fetchIssueDetails = async () => {
    try {
      console.log(
        `Fetching issue details for project ${projectId} and issue ${issueId}`
      );
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched issue details:", data); // 디버깅 로그 추가
        setIssue(data);
        setStatus(data.status); // 초기 상태 설정
        setAssigneeId(data.assignee ? data.assignee.id : undefined); // 초기 담당자 설정
        fetchComments();
      } else {
        throw new Error("Failed to fetch issue details");
      }
    } catch (error) {
      console.error("Error fetching issue details:", error);
    }
  };

  const fetchDevUsers = async () => {
    try {
      const response = await fetch("https://swe.mldljyh.tech/api/users/devs", {
        method: "GET",
        credentials: "include", // 필요한 경우에만 사용
      });

      if (response.ok) {
        const data = await response.json();
        setDevUsers(data);
      } else {
        throw new Error("개발자 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("개발자 정보 불러오기 실패:", error);
    }
  };

  const fetchRecommendedAssignees = async () => {
    try {
      console.log(
        `Fetching recommended assignees for project ${projectId} and issue ${issueId}`
      ); // 디버깅 로그 추가
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}/recommendedAssignees`,
        {
          credentials: "include",
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Recommended assignees:", data); // 디버깅 로그 추가
        setRecommendedAssignees(data);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch recommended assignees:", errorData);
      }
    } catch (error) {
      console.error("Error fetching recommended assignees:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}/comments`,
        {
          method: "GET",
        }
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      } else {
        throw new Error("댓글 목록을 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("댓글 목록 불러오기 실패:", error);
    }
  };

  const handleAddComment = async () => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newComment }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const comment = await response.json();
        console.log("댓글 생성 성공:", comment);
        setNewComment("");
        fetchComments();
        fetchIssueDetails(); // 댓글 추가 후 이슈 정보 다시 가져오기
      } else if (response.status === 400) {
        throw new Error(
          "유효하지 않은 요청입니다. 댓글 내용을 입력했는지 확인하세요."
        );
      } else if (response.status === 404) {
        throw new Error("해당 이슈를 찾을 수 없습니다.");
      } else {
        throw new Error("댓글 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("댓글 생성 실패:", error);
    }
  };

  const handleUpdateComment = async () => {
    if (!commentToEdit) return; // 수정할 코멘트가 선택되지 않았으면 리턴

    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}/comments/${commentToEdit.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: editCommentContent }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const updatedComment = await response.json();
        console.log("댓글 수정 성공:", updatedComment);
        setCommentToEdit(null);
        setEditCommentContent("");
        fetchComments();
        fetchIssueDetails(); // 댓글 수정 후 이슈 정보 다시 가져오기
      } else {
        throw new Error("Failed to update comment");
      }
    } catch (error) {
      console.error("댓글 수정 실패:", error);
    }
  };

  const handleUpdateStatus = async () => {
    console.log("Updating status:", status); // 디버깅 로그 추가
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const updatedIssue = await response.json();
        console.log("이슈 수정 성공:", updatedIssue);
        alert("Issue status updated successfully!");
        setIssue(updatedIssue); // 상태 업데이트 후 데이터 설정
        setStatus(updatedIssue.status); // 상태 반영
      } else if (response.status === 400) {
        throw new Error("유효하지 않은 요청입니다. 수정 권한을 확인하세요.");
      } else if (response.status === 404) {
        throw new Error("해당 이슈를 찾을 수 없습니다.");
      } else {
        throw new Error("이슈 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("이슈 수정 실패:", error);
      alert("An error occurred while updating the issue status.");
    }
  };

  const handleUpdateAssignee = async () => {
    console.log("Updating assignee ID:", assigneeId); // 디버깅 로그 추가
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignee: assigneeId ? { id: assigneeId } : null,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        alert("Issue assignee updated successfully!");
        setIssue(data); // 상태 업데이트 후 데이터 설정
        setAssigneeId(data.assignee ? data.assignee.id : undefined); // 담당자 반영
      } else {
        const errorData = await response.json();
        console.error("Failed to update issue assignee:", errorData);
        alert("Failed to update issue assignee.");
      }
    } catch (error) {
      console.error("Error updating issue assignee:", error);
      alert("An error occurred while updating the issue assignee.");
    }
  };

  const handleBothChange = async (
    newStatus: string,
    newAssigneeId: number | undefined
  ) => {
    console.log("Updating status:", newStatus, "Assignee ID:", newAssigneeId); // 디버깅 로그 추가
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
            assignee: newAssigneeId ? { id: newAssigneeId } : null,
          }),
          credentials: "include",
        }
      );

      const responseData = await response.json();
      console.log("Response status:", response.status);
      console.log("Response data:", responseData);

      if (response.ok) {
        alert("Issue status updated successfully!");
        setIssue(responseData); // 상태 업데이트 후 데이터 설정
        setStatus(responseData.status); // 상태 반영
      } else {
        console.error("Failed to update issue status:", responseData);
        alert("Failed to update issue status.");
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
      alert("An error occurred while updating the issue status.");
    }
  };

  const handleDeleteComment = async () => {
    // 5/24
    if (!commentToDelete) return; // 수정된 부분: commentToDelete 확인

    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}/comments/${commentToDelete.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        fetchIssueDetails(); // 댓글 삭제 후 이슈 정보 다시 가져오기
      } else {
        console.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    } finally {
      setCommentToDelete(null); // 다이얼로그 닫기
    }
  };

  if (!issue) {
    return null;
  }

  return (
    <div>
      <main
        key="1"
        className="container mx-auto px-4 py-8 md:px-6 lg:px-8 bg-white min-h-screen"
        style={{ minHeight: "calc(100vh - 5rem)", paddingBottom: "5rem" }}
      >
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold">{issue.title}</h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {issue.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
                    {issue.priority}
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium text-white ${
                      issue.status === 'NEW'
                        ? 'bg-gray-500'
                        : issue.status === 'ASSIGNED'
                        ? 'bg-yellow-500'
                        : issue.status === 'FIXED'
                        ? 'bg-indigo-500'
                        : issue.status === 'RESOLVED'
                        ? 'bg-green-500'
                        : issue.status === 'CLOSED'
                        ? 'bg-red-500'
                        : 'bg-purple-500'
                    }`}
                  >
                    {issue.status}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Reported by</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="border-2 border-gray-300 rounded-full">
                      <AvatarImage
                        alt="@shadcn"
                        src="/placeholder-user.jpg"
                        className="rounded-full"
                      />
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {issue.reporterUsername}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(issue.reportedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Assigned to</p>
                  <div className="flex items-center gap-2">
                    {issue.assignee ? (
                      <>
                        <Avatar className="border-2 border-gray-300 rounded-full">
                          <AvatarImage
                            alt="@shadcn"
                            src="/placeholder-user.jpg"
                            className="rounded-full"
                          />
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {issue.assignee.username}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm font-medium">Unassigned</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Fixed by</p>
                  <div className="flex items-center gap-2">
                    {issue.fixer ? (
                      <>
                        <Avatar className="border-2 border-gray-300 rounded-full">
                          <AvatarImage
                            alt="@shadcn"
                            src="/placeholder-user.jpg"
                            className="rounded-full"
                          />
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {issue.fixer.username}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm font-medium">Unassigned</p>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Description</h2>
                <div className="prose prose-sm dark:prose-invert">
                  <p>{issue.description}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Comments</h2>
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage
                          alt="@shadcn"
                          src="/placeholder-avatar.jpg"
                        />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {comment.username}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(
                              comment.updatedAt || comment.createdAt
                            ).toLocaleString()}
                          </p>
                        </div>
                        {commentToEdit && commentToEdit.id === comment.id ? (
                          <div className="flex flex-col gap-2">
                            <Textarea
                              value={editCommentContent}
                              onChange={(e) =>
                                setEditCommentContent(e.target.value)
                              }
                            />
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="xs"
                                variant="secondary"
                                className="p-1 text-xs"
                                onClick={() => setCommentToEdit(null)} // 수정 모드 취소
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateComment}
                                size="xs"
                                className="p-1 text-xs"
                              >
                                Update
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex">
                            <p className="text-sm grow mr-3">
                              {comment.content}
                            </p>
                            <div className="glow-0 flex justify-end">
                              {user && user.role === "ADMIN" && (
                                <Button
                                  variant="secondary"
                                  size="xs"
                                  className="p-1 text-xs mr-2"
                                  onClick={() => {
                                    setCommentToEdit(comment);
                                    setEditCommentContent(comment.content);
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                              {user && user.role === "ADMIN" && (
                                <DeleteConfirmDialog
                                  trigger={
                                    <Button
                                      variant="destructive"
                                      size="xs"
                                      className="p-1 text-xs"
                                      onClick={() =>
                                        setCommentToDelete(comment)
                                      }
                                    >
                                      Delete
                                    </Button>
                                  }
                                  title="Delete Comment"
                                  description="Are you sure you want to delete this comment?"
                                  onConfirm={handleDeleteComment}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-2">
                  <Label className="sr-only" htmlFor="new-comment">
                    New Comment
                  </Label>
                  <Textarea
                    className="min-h-[100px]"
                    id="new-comment"
                    placeholder="Add a new comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment}>Add Comment</Button>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label id="status-label">Status</Label>
                  <Select
                    value={status}
                    aria-labelledby="status-label"
                    onValueChange={setStatus} // Convert value to number
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="ASSIGNED">Assigned</SelectItem>
                      <SelectItem value="FIXED">Fixed</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="REOPENED">Reopened</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end items-end h-full">
                    <Button onClick={handleUpdateStatus}>Update Status</Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label id="assignee-label">Assignee</Label>
                  <Select
                    value={assigneeId ? assigneeId.toString() : ""} // Convert to string for Select component
                    aria-labelledby="assignee-label"
                    onValueChange={(value) => setAssigneeId(Number(value))} // Convert value to number
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Use devUsers for assignee options */}
                      {devUsers.map((dev: any) => (
                        <SelectItem key={dev.id} value={dev.id.toString()}>
                          {dev.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex justify-end items-end h-full">
                    <Button onClick={handleUpdateAssignee}>
                      Update Assignee
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recommended Assignees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  {recommendedAssignees.map((assignee: any) => (
                    <div key={assignee.id} className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          alt="@shadcn"
                          src="/placeholder-avatar.jpg"
                        />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {assignee.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {/* TODO: 역할 정보 추가 */}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAssigneeId(assignee.id);
                          setStatus("ASSIGNED");
                          handleBothChange("ASSIGNED", assignee.id);
                        }}
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t shrink-0 md:px-6 z-10 flex justify-end">
        {user && user.role === "ADMIN" && (
          <EditIssueForm
            projectId={Number(projectId)}
            issueId={Number(issueId)}
          />
        )}
        <Button
          className="ml-2"
          variant="outline"
          onClick={() => router.push(`/project/${projectId}`)}
        >
          Back to Issues
        </Button>
      </footer>
    </div>
  );
}
