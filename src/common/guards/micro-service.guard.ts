import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';

@Injectable()
export class MicroServiceGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Extract token from headers
    const req = context.switchToHttp().getRequest();
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('No token provided');

    // 2. Call Auth microservice for user info (roles, permissions)
    let user: any;
    try {
      user = await axios
        .get('http://localhost:4005/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          return response.data.data;
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          throw new UnauthorizedException('Invalid token');
        });
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }

    if (!user) throw new UnauthorizedException('Invalid user');

    req.user = user; // Attach user to request for downstream use

    // 3. Short-circuit for super admin
    if (user.roles?.includes('super admin')) return true;

    // 4. Read required roles/permissions from decorators
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 5. Check roles
    if (requiredRoles && !requiredRoles.some((role) => user.roles?.includes(role))) {
      throw new ForbiddenException('Insufficient role');
    }
    // 6. Check permissions
    if (
      requiredPermissions &&
      !requiredPermissions.some((perm) => user.permissions?.includes(perm))
    ) {
      throw new ForbiddenException('Insufficient permission');
    }

    return true;
  }
}
