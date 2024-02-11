#!/usr/bin/env node

import { Command } from "commander";
import simpleGit from "simple-git";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();
const git = simpleGit();

const nameToEnv = {
  elasticsearchHost: "ELASTICSEARCH_HOST",
  elasticsearchIndex: "ELASTICSEARCH_INDEX",
  elasticsearchApiKey: "ELASTICSEARCH_API_KEY",
  openaiApiKey: "OPENAI_API_KEY",
  color: "NEXT_PUBLIC_PRIMARY_COLOR",
};

const getEnv = (responses) => {
  return Object.keys(responses)
    .map((key) => {
      const envKey = nameToEnv[key];

      if (!envKey) return "";
      return `${envKey}=${responses[key]}`;
    })
    .filter(Boolean)
    .join("\n");
};

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
  const settingsPath = path.join(__dirname, "settings.json");

  let settings = [];
  try {
    const settingsData = await fs.readFile(settingsPath, "utf8");
    settings = JSON.parse(settingsData);
  } catch (err) {
    console.error("Failed to load settings.json:", err);
    process.exit(1); // Exit if the settings cannot be loaded
  }

  const filteredQuestions = settings.filter((question) => {
    return options[question.name] === undefined;
  });

  let responses = { ...options };

  if (filteredQuestions.length > 0) {
    const inquirer = await import("inquirer");
    const inquirerResponses = await inquirer.default.prompt(filteredQuestions);
    responses = { ...responses, ...inquirerResponses };
  }

  const { name } = responses;

  const destination = name.trim() || "magicbox";

  try {
    console.log(`Building into ${destination}...`);

    await git.clone("https://github.com/llermaly/magicbox", destination);

    console.log("Creating configuration files...");

    const envContent = getEnv(responses);

    await fs.writeFile(`${destination}/backend/app/.env`, envContent);
    await fs.writeFile(`${destination}/frontend/.env`, envContent);

    console.log("Build complete!");
  } catch (error) {
    console.error("Failed to clone the repository or create .env file:", error);
  }
});

program.parse(process.argv);
