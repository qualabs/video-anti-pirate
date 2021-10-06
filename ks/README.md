# Environment variables
## JWT_SECRET
The secret that's shared between the backends to authenticate users.

## JWT_VALIDITY
In seconds, how long is this token valid? Defaults to 4h.

## KEY_TABLE
The table where the keys are stored on DynamoDB. By default "wm-keys".

## CONTROL_TABLE
The table where the control information is stored on DynamoDB. By default "wm-control".

## LAMBDA_NAME
The name of this lambda. This is used to fetch a graph of how many invokations this function has from CloudWatch.
The call to get the graph (and other control actions) count towards this number, so the actual number of license requests is (usually) one fewer than what the graph shows.

## REGION
The region the lambda is running in. This is used to fetch the graph from CloudWatch.
Defaults to us-east-1
