from agents.base import BaseAgent


class Storyteller(BaseAgent):
    agent_id = "storyteller"
    name = "The Storyteller"
    prompt_file = "storyteller.md"
