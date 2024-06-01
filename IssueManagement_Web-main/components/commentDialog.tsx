import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar";
import DeleteConfirmDialog from "@/components/ui/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Priority = "BLOCKER" | "CRITICAL" | "MAJOR" | "MINOR" | "TRIVIAL";
type Status = "NEW" | "ASSIGNED" | "FIXED" | "RESOLVED" | "CLOSED" | "REOPENED";

type Comment = {
  id: number;
  content: string;
  username: string;
  createdAt: string; // ISO 포맷 문자열로 가정
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

interface CommentDialogProps {
  projectId: string;
  issueId: string;
  initialComments: Comment[];
  user: any; // 로그인 중인 사용자 정보
}

const CommentDialog: React.FC<CommentDialogProps> = ({
  projectId,
  issueId,
  initialComments,
  user,
}) => {
  const [comments, setComments] = useState<Comment[]>(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [commentToEdit, setCommentToEdit] = useState<any>(null);
  const [editCommentContent, setEditCommentContent] = useState("");

  useEffect(() => {
    fetchComments();
  }, []);

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
        fetchComments(); // 댓글 추가 후 댓글 목록 다시 가져오기
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
          body: JSON.stringify({
            content: editCommentContent,
          }),
          credentials: "include",
        }
      );

      if (response.ok) {
        const updatedComment = await response.json();
        console.log("댓글 수정 성공:", updatedComment);
        setCommentToEdit(null);
        setEditCommentContent("");
        fetchComments(); // 댓글 수정 후 댓글 목록 다시 가져오기
      } else {
        throw new Error("Failed to update comment");
      }
    } catch (error) {
      console.error("댓글 수정 실패:", error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetch(
        `https://swe.mldljyh.tech/api/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        fetchComments(); // 댓글 삭제 후 댓글 목록 다시 가져오기
      } else {
        console.error("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="ml-2">
          {comments ? comments.length : 0} {/* 수정된 부분 */}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-screen">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
          <DialogDescription>
            Here are the comments for this issue.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="space-y-2 p-2.5 bg-gray-100 rounded-md"
              style={{ marginBottom: "1rem" }}
            >
              {commentToEdit && commentToEdit.id === comment.id ? (
                // 수정 모드인 경우
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{comment.username}</p>
                  </div>
                  <Textarea
                    className="w-full"
                    value={editCommentContent}
                    onChange={(e) => setEditCommentContent(e.target.value)}
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
                      size="xs"
                      className="p-1 text-xs"
                      onClick={handleUpdateComment} // 수정 내용 저장
                    >
                      Update
                    </Button>
                  </div>
                </div>
              ) : (
                // 일반 모드인 경우
                <>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarImage
                          alt="@shadcn"
                          src="/placeholder-avatar.jpg"
                        />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{comment.username}</p>
                    </div>
                    <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="w-full text-sm">{comment.content}</p>
                    <div className="flex justify-end space-x-2">
                      {user &&
                        (user.role === "ADMIN" ||
                          user.username === comment.username) && (
                          <>
                            <Button
                              size="xs"
                              variant="outline"
                              className="p-1 text-xs h-8"
                              onClick={() => {
                                setCommentToEdit(comment);
                                setEditCommentContent(comment.content);
                              }}
                            >
                              Edit
                            </Button>
                            <DeleteConfirmDialog
                              trigger={
                                <Button
                                  size="xs"
                                  variant="destructive"
                                  className="p-1 text-xs h-8"
                                >
                                  Delete
                                </Button>
                              }
                              title="Delete Comment"
                              description="Are you sure you want to delete this comment?"
                              onConfirm={() => handleDeleteComment(comment.id)}
                            />
                          </>
                        )}
                    </div>
                  </div>{" "}
                </>
              )}
            </div>
          ))}{" "}
        </div>
        <div className="space-y-2">
          <Textarea
            className="min-h-[80px]"
            placeholder="Add a new comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleAddComment}>Add Comment</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
