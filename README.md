# CDK Project Template

This template is used by me to speed up the spin up of new CDK deployed projects. Eventually I may turn
this into a command you can run with npx. For now, you can clone the repo and remove the parts you don't
want when you create a project.

## Structure

**.idea**

Contains IntelliJ IDEA configuration files. There is a .gitignore that IntelliJ creates for you in this
directory to prevent files that shouldn't be committed from being committed. This allows you to share
configuration files with your team without sharing your personal settings.

I enable eslint and prettier in my projects. IDEA is configured to automatically format files on save.

**cdk**

Contains the CDK TypeScript project. I use TypeScript exclusively with CDK. In my experience, the
least common denominator for engineers has been TypeScript. Nearly all software engineers have at
one time or another done JavaScript or TypeScript and TypeScript is reasonable for a DevOps engineer
who knows Python to pick up.

This was created with the following command:

```bash
mkdir cdk
cd cdk
cdk init -a cdk --language typescript
```

The cdk directory is not a the top level of the project because generally I like to use newer stuff including
ESM which the cdk project does not use. Keeping this directory separate also helps enforce the separation between
build and runtime dependencies.

The following modifications were done after project generation:

 - package-lock.json was replaced with pnpm-lock.json since I use pnpm and not npm
 - .npmrc file was added for pnpm to execute pre and post scripts
 - eslint and prettier and configs were added
 - README.md was removed
 - truemark-cdk-lib dependency was added
 - Value of @aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse was changed to false inside cdk.json files to support TrueMark's CdkPipeline with shared KMS keys.
 - test directory was removed and tests are now in the same directory as the code they test
 - version was removed cdk package.json file since we version the parent
 - esbuild was added locally since I avoid docker builds for local development speed
 - code was modified to use truemark-cdk-lib
 - code was added to support typical patterns I use in CDK projects

**resolvers**

Contains JS resolvers for AppSync written in TypeScript.

**handlers**

Contains Lambda handlers written in TypeScript.

**lib**

Contains common backend code that is shared between **app** and **handlers**.

**client**

Contains the client code that is used to interact with the backend.

**scripts**

Contains helper shell scripts.

**app**

Contains a modified template for a Qwik application. This was generated with the following command

```bash
mkdir app
cd app
pnpm create qwik@latest
```

The following modifications were done after project generation:

 - tailwindcss was added
 - trailing / were ignored
 - updated eslint and prettier configs
 - base classes used on many projects were added
 - serverless adapter was added
 - scripts in package.json were updated
 - tsconfig.json was modified


## Quick Links

 - [QwikDev Issues](https://github.com/QwikDev/qwik/issues)
 - [Iconify](https://icon-sets.iconify.design/)
 - [Lucia](https://lucia-auth.com/)
 - [Resolver $util](https://docs.aws.amazon.com/appsync/latest/devguide/utility-helpers-in-util.html)
 - [JWT Decoding](https://jwt.io/)
 - Qwik
   - [useResource$](https://qwik.dev/tutorial/reactivity/resource/)
   - Modular Forms
     -[formAction$](https://modularforms.dev/qwik/api/formAction$)

