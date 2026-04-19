import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'tasks',
})
export class TaskEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`客户端连接：${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`客户端断开：${client.id}`);
  }

  @SubscribeMessage('join-task')
  handleJoinTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    client.join(`task:${data.taskId}`);
    console.log(`客户端 ${client.id} 加入任务房间：task:${data.taskId}`);
    return { event: 'joined', data: { taskId: data.taskId } };
  }

  @SubscribeMessage('leave-task')
  handleLeaveTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    client.leave(`task:${data.taskId}`);
    console.log(`客户端 ${client.id} 离开任务房间：task:${data.taskId}`);
    return { event: 'left', data: { taskId: data.taskId } };
  }

  /**
   * 发送任务状态更新
   */
  emitTaskStatus(taskId: string, status: string, data?: any) {
    this.server.to(`task:${taskId}`).emit('task-status', {
      taskId,
      status,
      timestamp: new Date(),
      data,
    });
  }

  /**
   * 发送任务进度更新
   */
  emitTaskProgress(taskId: string, progress: number, processedItems: number, totalItems: number) {
    this.server.to(`task:${taskId}`).emit('task-progress', {
      taskId,
      progress,
      processedItems,
      totalItems,
      timestamp: new Date(),
    });
  }

  /**
   * 发送任务日志
   */
  emitTaskLog(taskId: string, level: string, message: string, metadata?: any) {
    this.server.to(`task:${taskId}`).emit('task-log', {
      taskId,
      level,
      message,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * 发送任务错误
   */
  emitTaskError(taskId: string, errorMessage: string, errorStack?: string) {
    this.server.to(`task:${taskId}`).emit('task-error', {
      taskId,
      errorMessage,
      errorStack,
      timestamp: new Date(),
    });
  }

  /**
   * 发送任务完成通知
   */
  emitTaskComplete(taskId: string, result?: any) {
    this.server.to(`task:${taskId}`).emit('task-complete', {
      taskId,
      result,
      timestamp: new Date(),
    });
  }

  /**
   * 发送任务健康状态
   */
  emitTaskHealth(taskId: string, health: { status: string; score: number; issues: string[] }) {
    this.server.to(`task:${taskId}`).emit('task-health', {
      taskId,
      health,
      timestamp: new Date(),
    });
  }
}
