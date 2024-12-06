import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task } from './task.schema';
import { Model } from 'mongoose';
import mongoose from 'mongoose';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  // Helper function to handle task existence checks
  private async findTaskById(id: string): Promise<Task> {
    try {
      const task = await this.taskModel.findById(id).exec();
      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      return task;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to retrieve the task',
        error,
      );
    }
  }

  async findAll(): Promise<Task[]> {
    try {
      const tasks = await this.taskModel.find().exec();
      if (tasks.length === 0) {
        throw new NotFoundException('No tasks found');
      }
      return tasks;
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve tasks', error);
    }
  }

  async findById(id: string): Promise<Task> {
    return this.findTaskById(id);
  }

  async create(task: Task): Promise<Task> {
    try {
      const newTask = new this.taskModel(task);
      return await newTask.save();
    } catch (error) {
      throw new InternalServerErrorException('Error creating task', error);
    }
  }

  async update(id: string, task: Task): Promise<Task> {
    try {
      const updatedTask = await this.taskModel
        .findByIdAndUpdate(id, task, { new: true })
        .exec();
      if (!updatedTask) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      return updatedTask;
    } catch (error) {
      throw new InternalServerErrorException('Failed to update task', error);
    }
  }

  async delete(id: string): Promise<Task> {
    try {
      const deletedTask = await this.taskModel.findByIdAndDelete(id).exec();
      if (!deletedTask) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }
      return deletedTask;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete task', error);
    }
  }

  async findByQuery(query: any): Promise<Task[]> {
    try {
      const filterQuery: any = {};

      if (query.status) {
        filterQuery.status = query.status;
      }

      if (query.priority) {
        filterQuery.priority = query.priority;
      }

      if (query.dueDate) {
        filterQuery.dueDate = this.parseDueDate(query.dueDate);
      }

      return await this.taskModel.find(filterQuery).exec();
    } catch (error) {
      throw new InternalServerErrorException('Failed to query tasks', error);
    }
  }

  private parseDueDate(dueDate: string) {
    const dueDateRange = dueDate.split(',');
    if (dueDateRange.length === 2) {
      const [startDate, endDate] = dueDateRange.map((date) => new Date(date));
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new InternalServerErrorException(
          `Invalid date range: ${dueDate}`,
        );
      }
      return { $gte: startDate, $lte: endDate };
    } else {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        throw new InternalServerErrorException(`Invalid date: ${dueDate}`);
      }
      return date;
    }
  }

  async assignTask(taskId: string, userIds: string[]): Promise<Task> {
    try {
      const task = await this.findTaskById(taskId);

      const userObjectIds = userIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );

      task.assignedTo = userObjectIds;
      return await task.save();
    } catch (error) {
      throw new InternalServerErrorException('Failed to assign task', error);
    }
  }

  // Method to change the status of a task
  async changeStatus(
    taskId: string,
    status:
      | 'pending'
      | 'in-progress'
      | 'completed'
      | 'cancelled'
      | 'not-started'
      | 'on-hold',
  ): Promise<Task> {
    try {
      const task = await this.findTaskById(taskId);
      task.status = status;
      return await task.save();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to change task status',
        error,
      );
    }
  }
}
