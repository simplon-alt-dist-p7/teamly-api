import { Injectable } from '@nestjs/common';
import { TaskCheck } from '../../domain/models/task-check.entity';
import { TaskList } from '../../domain/models/task-list.entity';
import { Task } from '../../domain/models/task.entity';
import { TaskListsRepository } from '../task-lists.repository';

@Injectable()
export class TaskListsInMemoryRepository implements TaskListsRepository {
  taskLists: TaskList[] = [];
  taskChecks: TaskCheck[] = [];

  async save(taskList: TaskList): Promise<void> {
    this.taskLists.push(taskList);
  }

  async findById(id: string): Promise<TaskList | null> {
    return this.taskLists.find((list) => list.id === id) ?? null;
  }

  async findByRestaurantId(
    restaurantId: string,
    day?: Date,
  ): Promise<TaskList[]> {
    const taskLists = this.taskLists.filter(
      (taskList) => taskList.restaurantId === restaurantId,
    );

    if (!day) {
      return taskLists;
    }

    return taskLists.map(
      (taskList) =>
        new TaskList({
          id: taskList.id,
          restaurantId: taskList.restaurantId,
          name: taskList.name,
          tasks: taskList.tasks.map((task) => {
            const taskCheck = this.taskChecks.find(
              (check) =>
                check.taskId === task.id &&
                check.day.getTime() === day.getTime(),
            );

            return new Task({
              id: task.id,
              taskListId: task.taskListId,
              label: task.label,
              requiresValidation: task.requiresValidation,
              todayCheck: taskCheck
                ? {
                    employeeFirstName: '',
                    employeeLastName: '',
                    checkedAt: taskCheck.checkedAt,
                  }
                : null,
            });
          }),
        }),
    );
  }

  async addTask(task: Task): Promise<void> {
    const taskList = this.taskLists.find((list) => list.id === task.taskListId);
    taskList?.tasks.push(task);
  }

  async removeTask(taskId: string): Promise<void> {
    for (const taskList of this.taskLists) {
      const index = taskList.tasks.findIndex((task) => task.id === taskId);
      if (index !== -1) {
        taskList.tasks.splice(index, 1);
      }
    }
  }

  async findTaskCheck(taskId: string, day: Date): Promise<TaskCheck | null> {
    return (
      this.taskChecks.find(
        (taskCheck) =>
          taskCheck.taskId === taskId &&
          taskCheck.day.getTime() === day.getTime(),
      ) ?? null
    );
  }

  async addTaskCheck(taskCheck: TaskCheck): Promise<void> {
    this.taskChecks.push(taskCheck);
  }
}
