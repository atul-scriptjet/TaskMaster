import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { RolesGuard } from 'src/guards/roles.guard';
import { Roles } from 'src/decorator/roles.decorator';
import { UserRole } from 'src/users/users.schema';
import { Task } from './task.schema';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  // Admin routes
  @Get('all')
  @Roles(UserRole.Admin)
  @UseGuards(RolesGuard)
  async findAll() {
    return this.taskService.findAll();
  }

  @Post('create')
  @Roles(UserRole.Admin)
  @UseGuards(RolesGuard)
  async create(@Body() task: Task) {
    return this.taskService.create(task);
  }

  @Post('assign')
  @Roles(UserRole.Admin)
  @UseGuards(RolesGuard)
  async assignTask(@Body() body: { taskId: string; userIds: string[] }) {
    return this.taskService.assignTask(body.taskId, body.userIds);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  @UseGuards(RolesGuard)
  async delete(@Param('id') id: string) {
    return this.taskService.delete(id);
  }

  // User routes

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const user = req.user;
    const task = await this.taskService.findById(id);
    this.checkTaskPermission(user, task);
    return task;
  }

  @Get('filter')
  async findFilteredTasks(
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('dueDate') dueDate: string,
    @Request() req,
  ) {
    const user = req.user;
    const query: any = this.buildQuery(status, priority, dueDate, user);
    return this.taskService.findByQuery(query);
  }

  @Put('update/:id')
  async updateTask(
    @Param('id') id: string,
    @Body() task: Task,
    @Request() req,
  ) {
    const user = req.user;
    const taskToUpdate = await this.taskService.findById(id);
    this.checkTaskPermission(user, taskToUpdate);
    return this.taskService.update(id, task);
  }

  @Delete('delete/:id')
  async deleteTask(@Param('id') id: string, @Request() req) {
    const user = req.user;
    const taskToDelete = await this.taskService.findById(id);
    this.checkTaskPermission(user, taskToDelete);
    return this.taskService.delete(id);
  }

  @Put('updateStatus/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body() task: Task,
    @Request() req,
  ) {
    const user = req.user;
    const taskToUpdate = await this.taskService.findById(id);
    this.checkTaskPermission(user, taskToUpdate);
    return this.taskService.changeStatus(id, task.status);
  }

  /**
   * Helper method to check if the user has permission to access the task.
   */
  private checkTaskPermission(user: any, task: Task) {
    if (
      user.role !== UserRole.Admin &&
      task.assignedTo.toString() !== user._id.toString()
    ) {
      throw new ForbiddenException(
        'You are not authorized to access this task',
      );
    }
  }

  /**
   * Helper method to build the query for filtered tasks.
   */
  private buildQuery(
    status: string,
    priority: string,
    dueDate: string,
    user: any,
  ): any {
    const query: any = {};

    if (user.role !== UserRole.Admin) {
      query.assignedTo = user._id;
    }

    if (status) {
      this.validateStatus(status);
      query.status = status;
    }

    if (priority) {
      this.validatePriority(priority);
      query.priority = priority;
    }

    if (dueDate) {
      query.dueDate = this.parseDueDate(dueDate);
    }

    return query;
  }

  /**
   * Validate the status value.
   */
  private validateStatus(status: string) {
    const validStatuses = ['open', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status value: ${status}`);
    }
  }

  /**
   * Validate the priority value.
   */
  private validatePriority(priority: string) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      throw new BadRequestException(`Invalid priority value: ${priority}`);
    }
  }

  /**
   * Parse the dueDate query parameter into a MongoDB date range or single date.
   */
  private parseDueDate(dueDate: string) {
    const dueDateRange = dueDate.split(',');
    if (dueDateRange.length === 2) {
      const [startDate, endDate] = dueDateRange.map((date) => new Date(date));
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException(`Invalid date range: ${dueDate}`);
      }
      return { $gte: startDate, $lte: endDate };
    } else {
      const date = new Date(dueDate);
      if (isNaN(date.getTime())) {
        throw new BadRequestException(`Invalid date: ${dueDate}`);
      }
      return date;
    }
  }
}
