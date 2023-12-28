# Importing necessary modules for OpenAI integration and file operations
from openai import OpenAI
import os

# Default prompt for formulating questions
formulate_questions_prompt_default = """You are a senior recruiter, you are generating a set of questions that can be used to summarize a person's CV/Resume and consider whether the candidate is a fit for a job for the company.
You should generate around 20 questions to summarize verify whether the candidate is a fit,  based on basic information of the candidates, company background, job duties and job requirements.
The questions should be designed in a way that we don't need to provide the company background, job duties and job requirements again when answering it, that is its better to incorporate company background, job duties and job requirements in these questions.
Try to make questions that can be answered from a CV instead of questions that can only be answered in an interview.
It recommended you create some questions that rate the cadidate fitness on a 1-10 scale and a separate follow up question explaining why the rank apply,the rating questions should be very role specifc and detail.
You must ask the following, Candidates english name, Candiates chinese name, Candidate expected salary, Candidate Email, Candidates Phone Number, Candidate availability, candidates linkedin, candidates wechat, candidates expected salary, candidates last salary if any.
Focus on answering manual questions first.
Don't seperate the questions into groups, just make it in the same group/set.
You should also generate a sample answers to the question as well in json format. The sample answers should be detail and comprehensive.
Format the output in RFC8259 compliant JSON format, using UTF-8 encoding.
The json output will be used in another program in conjunction with candidates CV/resume to provide valuable output.
Only provide the JSON output, nothing else.
Don't seperate the questions into groups, just make it in the same group/set.

Sample Output:
"What's the candidate's english name":"Conrad Ko",
"what's the candiates's phone number":"+85293475637",
"Question1": "SampleAnswer1",
"Question2": "SampleAnswer2",
"Question3": "SampleAnswer3",
"Question4": "SampleAnswer4",
"""

# Default prompt for summarizing CVs
summarize_cv_prompt_default = """Give well-reasoned and critical assessments with solid evidence from the CV/Resume.
Include specific details such as names, years, company names, job titles, institutions, and other relevant information.
Be very detail oriented.
Use both English and Chinese for all nouns and terms.
Write as if you are a very seasoned recruiter with keen eye on details and focus on the merit and background of the candidate.
When answering yes or no please substaniate with reasons and evidence.
If information is unavailable or unknown, input "No Info", don't fill in "No".
If you are negative about the answer, fill in or "No", don't fill in "N/A".
Don't give "No Info" answers to 1-10 rating questions, make an educated guess.
When providing output, you can have educated guesses but make sure to specify its an educated guess.
If the country code for the phone number is not indicated, the default is Hong Kong +852.
Format the output in RFC8259 compliant JSON format, using UTF-8 encoding.
Output should be very deatiled and legible, try not to just give yes no answers.
The output should be ready for presentation to the client and reference during the interview process.
Answers should be in English.

Only provide the JSON output, nothing else."""

# Function for formulating questions using ChatGPT
def formulate_question_using_chat_gpt(
        gpt_api_key,
        gpt_model,
        formulate_questions_prompt,
        job_title, 
        company_background, 
        job_duties, 
        job_requirements, 
        manualquestions
    ):
    try:
        # Creating an OpenAI client
        client = OpenAI(api_key=gpt_api_key)

        # Generating questions using ChatGPT
        response = client.chat.completions.create(
            model=gpt_model,
            messages=[
                {
                    "role": "system",
                    "content": f"""
                        {formulate_questions_prompt}
                    """
                },
                {
                    "role": "user",
                    "content": f"""
                    Company Background:
                    {company_background}

                    Job Title:
                    {job_title}

                    Job Duties:
                    {job_duties}

                    Job Requirements:
                    {job_requirements}

                    Manual Questions:
                    {manualquestions}
                    """},
            ],
            temperature=0.2,
        )
        questions = response.choices[0].message.content
        return questions, 'SUCCESS'
    except Exception as e:
        print(f"Failed to generate question: {e}")
        return str(e), 'FAILED'

# Function for summarizing CVs using ChatGPT
def summarize_using_chat_gpt(
        cv,
        gpt_api_key,
        gpt_model,
        summarize_cv_prompt,
        questions,
        job_title, 
        company_background, 
        job_duties, 
        job_requirements
    ):
    try:
        # Creating an OpenAI client
        client = OpenAI(api_key=gpt_api_key)

        # Summarizing CV using ChatGPT
        response = client.chat.completions.create(
            model=gpt_model,
            messages=[
                {
                    "role": "system","content": f"""
                    {summarize_cv_prompt}"""},
                {
                    "role": "user",
                    "content": f"""

                    CV/Resume:
                    {cv}

                    Employer Company Background:
                    {company_background}

                    Job Title:
                    {job_title}

                    Job Duties:
                    {job_duties}

                    Job Requirements:
                    {job_requirements}

                    Question we want to ask and you should generate json output on:
                    {questions}
"""},
            ],
            temperature=0.2
        )
        summary = response.choices[0].message.content
        return summary, 'SUCCESS'
    except Exception as e:
        print(f"Failed to summarize: {e}")
        return str(e), 'FAILED'