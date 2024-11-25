import {Context, util} from '@aws-appsync/utils';

export function request(ctx: Context) {
  const accountId = ctx.env.accountId;
  const queueUrl = ctx.env.messageQueueUrl;
  const queueName = ctx.env.messageQueueName;
  console.log('Account ID', accountId);
  console.log('Queue URL', queueUrl);
  console.log('Queue Name', queueName);
  console.log('Context Arguments', ctx.args);

  const messageId = util.autoUlid();
  const now = util.time.nowISO8601();
  let body = 'Action=SendMessage&Version=2012-11-05';
  const message = {
    messageId,
    sessionId: ctx.args.sessionId,
    message: ctx.args.body,
    createdAt: now,
    handle: ctx.args.handle,
    body: ctx.args.body,
  };
  const messageBody = util.urlEncode(JSON.stringify(message));
  const queueUrlEncoded = util.urlEncode(queueUrl);
  body = `${body}&MessageBody=${messageBody}&QueueUrl=${queueUrlEncoded}&MessageGroupId=${ctx.args.sessionId}&MessageDeduplicationId=${messageId}`;

  ctx.stash.result = message;
  return {
    version: '2018-05-29',
    method: 'POST',
    resourcePath: `/${accountId}/${queueName}`,
    params: {
      body,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    },
  };
}

export function response(ctx: Context) {
  console.log('Response', ctx.result);
  if (ctx.result.statusCode === 200) {
    console.log('Result', ctx.result.result);
    return ctx.stash.result;
  } else {
    console.error('Error', ctx.result.body);
    return util.appendError(ctx.result.body, ctx.result.statusCode);
  }
}
