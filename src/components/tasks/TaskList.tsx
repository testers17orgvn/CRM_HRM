import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import EditTaskDialog from "./EditTaskDialog";
import { Search, X } from "lucide-react";

const TaskList = ({ role }: { role: UserRole }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");

  const fetchTasks = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Get unique values for filters
  const uniquePriorities = useMemo(() =>
    [...new Set(tasks.map(t => t.priority))].sort(),
    [tasks]
  );

  const uniqueStatuses = useMemo(() =>
    [...new Set(tasks.map(t => t.status))].sort(),
    [tasks]
  );

  const uniqueAssignees = useMemo(() =>
    [...new Set(tasks.filter(t => t.assignee_id).map(t => t.assignee_id))],
    [tasks]
  );

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesPriority = priorityFilter === "" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "" || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === "" || task.assignee_id === assigneeFilter;

      return matchesSearch && matchesPriority && matchesStatus && matchesAssignee;
    });
  }, [tasks, searchQuery, priorityFilter, statusFilter, assigneeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("");
    setStatusFilter("");
    setAssigneeFilter("");
  };

  const hasActiveFilters = searchQuery || priorityFilter || statusFilter || assigneeFilter;

  if (loading) {
    return <SkeletonTable rows={8} columns={6} />;
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow 
              key={task.id} 
              className="cursor-pointer hover:bg-secondary/50"
              onClick={() => {
                setSelectedTask(task);
                setEditDialogOpen(true);
              }}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{task.title}</p>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
              </TableCell>
              <TableCell>
                <Badge>{task.priority}</Badge>
              </TableCell>
              <TableCell>
                {task.assignee_id ? 'Assigned' : 'Unassigned'}
              </TableCell>
              <TableCell>
                {task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy') : '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(task.created_at), 'MMM dd, yyyy')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <EditTaskDialog
        task={selectedTask}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
};

export default TaskList;
