import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common"
import {
  MongoNetworkError,
  MongoNotConnectedError,
  MongoServerSelectionError,
  MongoTopologyClosedError,
} from "mongodb"
import { Response } from "express"

// Turns "can't reach MongoDB" driver errors into 503s instead of generic 500s
@Catch(
  MongoNetworkError,
  MongoServerSelectionError,
  MongoNotConnectedError,
  MongoTopologyClosedError
)
export class MongoUnavailableFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoUnavailableFilter.name)

  catch(err: Error, host: ArgumentsHost) {
    this.logger.warn(`Database unavailable: ${err.message}`)
    host.switchToHttp().getResponse<Response>().status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: "Service Unavailable",
      message: "Database unavailable",
    })
  }
}
