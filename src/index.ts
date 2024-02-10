import { Command } from "commander";
import simpleGit from "simple-git";
import fs from "fs/promises"; 
import settings from "./settings.json" with {type:"json"};

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


program.action(async (options) => {

  const filteredQuestions = settings.filter(question => {
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
  } = responses;

  const destination = name.trim() || "magicbox";

  try {
    console.log(`Building into ${destination}...`);

    await git.clone("https://github.com/llermaly/magicbox", destination);

    console.log("Creating configuration files...");

    const envContent = `ELASTICSEARCH_HOST=${elasticsearchHost}
ELASTICSEARCH_INDEX=${elasticsearchIndex}
ELASTICSEARCH_API_KEY=${elasticsearchApiKey}
OPENAI_API_KEY=${openaiApiKey}
`;
    await fs.writeFile(`${destination}/frontend/.env`, envContent);
    await fs.writeFile(`${destination}/backend/app/.env`, envContent);

    console.log("Build complete!");
  } catch (error) {
    console.error("Failed to clone the repository or create .env file:", error);
  }
});

program.parse(process.argv);
