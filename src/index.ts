#!/usr/bin/env node

import { Command } from "commander";
import simpleGit from "simple-git";
import fs from "fs/promises";

const settings = [
  {
    type: "input",
    name: "name",
    message: "How would you like to name your project?",
    default: "magicbox",
  },
  {
    type: "input",
    name: "elasticsearchHost",
    message: "Enter the Elasticsearch host URL:",
  },
  {
    type: "input",
    name: "elasticsearchIndex",
    message: "Enter the Elasticsearch index:",
  },
  {
    type: "input",
    name: "elasticsearchApiKey",
    message: "Enter the Elasticsearch API key:",
  },
  {
    type: "input",
    name: "openaiApiKey",
    message: "Enter the OpenAI API key:",
  },
  {
    type: "input",
    name: "color",
    message: "Enter the primary color for the frontend:",
    default: "#0070f3",
  },
];

const program = new Command();
const git = simpleGit();

program
  .name("clone-magicbox")
  .description("Clones the magicbox repository")
  .version("0.0.1")
  .option("--name <projectName>", "Name of the project")
  .option("--elasticsearchHost <elasticsearchHost>", "Elasticsearch host URL")
  .option("--elasticsearchIndex <elasticsearchIndex>", "Elasticsearch index")
  .option(
    "--elasticsearchApiKey <elasticsearchApiKey>",
    "Elasticsearch API key"
  )
  .option("--openaiApiKey <openaiApiKey>", "OpenAI API key")
  .option("--color <color>", "Primary color for the frontend");

program.action(async (options) => {
  const filteredQuestions = settings.filter((question) => {
    return options[question.name] === undefined;
  });

  let responses = { ...options };

  if (filteredQuestions.length > 0) {
    const inquirer = await import("inquirer");
    const inquirerResponses = await inquirer.default.prompt(filteredQuestions);
    responses = { ...responses, ...inquirerResponses };
  }

  const {
    name,
    elasticsearchHost,
    elasticsearchIndex,
    elasticsearchApiKey,
    openaiApiKey,
    color,
  } = responses;

  const destination = name.trim() || "magicbox";

  try {
    console.log(`Building into ${destination}...`);

    await git.clone("https://github.com/llermaly/magicbox", destination);

    console.log("Creating configuration files...");

    let envContent = `ELASTICSEARCH_HOST=${elasticsearchHost}
ELASTICSEARCH_INDEX=${elasticsearchIndex}
ELASTICSEARCH_API_KEY=${elasticsearchApiKey}
OPENAI_API_KEY=${openaiApiKey}
`;
    await fs.writeFile(`${destination}/backend/app/.env`, envContent);

    envContent += `NEXT_PUBLIC_BACKEND_API=http://localhost:8000
    NEXT_PUBLIC_PRIMARY_COLOR=${color}`;

    await fs.writeFile(`${destination}/frontend/.env`, envContent);

    console.log("Build complete!");
  } catch (error) {
    console.error("Failed to clone the repository or create .env file:", error);
  }
});

program.parse(process.argv);
