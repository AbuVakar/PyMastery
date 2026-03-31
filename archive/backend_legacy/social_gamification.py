"""
Social Gamification - Team Challenges Backend
Provides team-based learning challenges, competitions, and social features
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
from enum import Enum

from database.mongodb import get_database
from services.openai_service import OpenAIService
from services.user_service import UserService

router = APIRouter(prefix="/api/v1/social-gamification", tags=["Social Gamification"])

class ChallengeType(str, Enum):
    CODING_BATTLE = "coding_battle"
    TEAM_PROJECT = "team_project"
    QUIZ_SHOWDOWN = "quiz_showdown"
    HACKATHON = "hackathon"
    COLLABORATIVE_DEBUG = "collaborative_debug"
    PEER_REVIEW = "peer_review"
    SPEED_CODING = "speed_coding"
    ALGORITHM_RACE = "algorithm_race"

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

class TeamRole(str, Enum):
    LEADER = "leader"
    DEVELOPER = "developer"
    DESIGNER = "designer"
    TESTER = "tester"
    MENTOR = "mentor"
    ANALYST = "analyst"

class Team(BaseModel):
    id: str
    name: str
    description: str
    avatar_url: Optional[str]
    created_at: datetime
    leader_id: str
    members: List[str]
    max_members: int
    skill_level: float
    total_points: int
    achievements: List[str]
    is_active: bool

class Challenge(BaseModel):
    id: str
    title: str
    description: str
    type: ChallengeType
    difficulty: DifficultyLevel
    max_teams: int
    max_participants_per_team: int
    duration_hours: int
    start_time: datetime
    end_time: datetime
    rules: List[str]
    objectives: List[str]
    scoring_criteria: Dict[str, float]
    prizes: List[Dict[str, Any]]
    requirements: List[str]
    is_active: bool

class TeamChallenge(BaseModel):
    id: str
    challenge_id: str
    team_id: str
    status: str  # "registered", "in_progress", "completed", "disqualified"
    registration_time: datetime
    start_time: Optional[datetime]
    completion_time: Optional[datetime]
    score: float
    rank: Optional[int]
    submission_data: Dict[str, Any]
    feedback: Optional[str]
    achievements: List[str]

class UserGamificationProfile(BaseModel):
    user_id: str
    username: str
    avatar_url: Optional[str]
    level: int
    experience_points: int
    total_points: int
    current_team_id: Optional[str]
    teams_participated: List[str]
    challenges_completed: List[str]
    achievements: List[str]
    badges: List[str]
    ranking: int
    skill_level: float
    collaboration_score: float
    leadership_score: float
    mentorship_score: float
    created_at: datetime
    last_active: datetime

class LeaderboardEntry(BaseModel):
    user_id: str
    username: str
    avatar_url: Optional[str]
    rank: int
    points: int
    level: int
    challenges_completed: int
    team_contributions: int
    streak_days: int

class SocialGamificationEngine:
    def __init__(self):
        self.openai_service = OpenAIService()
        self.user_service = UserService()
        
    async def create_team(self, team_name: str, description: str, leader_id: str, max_members: int = 5) -> Team:
        """Create a new team"""
        
        # Get leader's profile
        leader_profile = await self.get_user_gamification_profile(leader_id)
        
        team = Team(
            id=f"team_{datetime.utcnow().timestamp()}",
            name=team_name,
            description=description,
            avatar_url=None,
            created_at=datetime.utcnow(),
            leader_id=leader_id,
            members=[leader_id],
            max_members=max_members,
            skill_level=leader_profile.skill_level,
            total_points=0,
            achievements=[],
            is_active=True
        )
        
        # Save team to database
        db = await get_database()
        await db.teams.insert_one(team.dict())
        
        # Update user's profile
        await self.update_user_team_membership(leader_id, team.id, TeamRole.LEADER)
        
        return team
    
    async def join_team(self, user_id: str, team_id: str, role: TeamRole = TeamRole.DEVELOPER) -> bool:
        """Add user to a team"""
        
        db = await get_database()
        
        # Get team
        team = await db.teams.find_one({"id": team_id})
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if team is full
        if len(team["members"]) >= team["max_members"]:
            return False
        
        # Add user to team
        await db.teams.update_one(
            {"id": team_id},
            {"$push": {"members": user_id}}
        )
        
        # Update user's profile
        await self.update_user_team_membership(user_id, team_id, role)
        
        return True
    
    async def create_challenge(self, title: str, description: str, challenge_type: ChallengeType, 
                             difficulty: DifficultyLevel, duration_hours: int, max_teams: int = 10) -> Challenge:
        """Create a new challenge"""
        
        # Generate challenge details using AI
        challenge_prompt = f"""
        Generate a comprehensive {challenge_type.value} challenge for programming education:
        
        Title: {title}
        Description: {description}
        Type: {challenge_type.value}
        Difficulty: {difficulty.value}
        Duration: {duration_hours} hours
        Max Teams: {max_teams}
        
        Create challenge details that:
        1. Are engaging and competitive
        2. Have clear rules and objectives
        3. Include fair scoring criteria
        4. Provide meaningful prizes
        5. Have appropriate difficulty for the target level
        6. Encourage teamwork and collaboration
        7. Include specific requirements
        
        Return as JSON with:
        - rules (array of challenge rules)
        - objectives (array of learning objectives)
        - scoring_criteria (dict with criteria and weights)
        - prizes (array of prize descriptions)
        - requirements (array of participation requirements)
        """
        
        try:
            challenge_data = await self.openai_service.generate_response(challenge_prompt)
            challenge_json = json.loads(challenge_data)
            
            challenge = Challenge(
                id=f"challenge_{datetime.utcnow().timestamp()}",
                title=title,
                description=description,
                type=challenge_type,
                difficulty=difficulty,
                max_teams=max_teams,
                max_participants_per_team=5,
                duration_hours=duration_hours,
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(hours=duration_hours),
                rules=challenge_json.get("rules", []),
                objectives=challenge_json.get("objectives", []),
                scoring_criteria=challenge_json.get("scoring_criteria", {}),
                prizes=challenge_json.get("prizes", []),
                requirements=challenge_json.get("requirements", []),
                is_active=True
            )
            
            # Save challenge to database
            db = await get_database()
            await db.challenges.insert_one(challenge.dict())
            
            return challenge
            
        except Exception as e:
            # Fallback challenge
            return Challenge(
                id=f"challenge_{datetime.utcnow().timestamp()}",
                title=title,
                description=description,
                type=challenge_type,
                difficulty=difficulty,
                max_teams=max_teams,
                max_participants_per_team=5,
                duration_hours=duration_hours,
                start_time=datetime.utcnow(),
                end_time=datetime.utcnow() + timedelta(hours=duration_hours),
                rules=["Follow the challenge guidelines", "Work as a team", "Submit before deadline"],
                objectives=[f"Complete the {challenge_type.value} challenge"],
                scoring_criteria={"completion": 0.5, "quality": 0.3, "teamwork": 0.2},
                prizes=[{"type": "badge", "description": "Challenge Completion Badge"}],
                requirements=[f"Basic programming knowledge"],
                is_active=True
            )
    
    async def register_team_for_challenge(self, team_id: str, challenge_id: str) -> TeamChallenge:
        """Register a team for a challenge"""
        
        db = await get_database()
        
        # Check if challenge exists and is active
        challenge = await db.challenges.find_one({"id": challenge_id, "is_active": True})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found or inactive")
        
        # Check if team is already registered
        existing = await db.team_challenges.find_one({
            "team_id": team_id,
            "challenge_id": challenge_id
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Team already registered for this challenge")
        
        # Create team challenge entry
        team_challenge = TeamChallenge(
            id=f"team_challenge_{datetime.utcnow().timestamp()}",
            challenge_id=challenge_id,
            team_id=team_id,
            status="registered",
            registration_time=datetime.utcnow(),
            start_time=None,
            completion_time=None,
            score=0.0,
            rank=None,
            submission_data={},
            feedback=None,
            achievements=[]
        )
        
        await db.team_challenges.insert_one(team_challenge.dict())
        
        return team_challenge
    
    async def submit_challenge_solution(self, team_id: str, challenge_id: str, submission_data: Dict[str, Any]) -> TeamChallenge:
        """Submit team's solution for a challenge"""
        
        db = await get_database()
        
        # Get team challenge
        team_challenge = await db.team_challenges.find_one({
            "team_id": team_id,
            "challenge_id": challenge_id
        })
        
        if not team_challenge:
            raise HTTPException(status_code=404, detail="Team not registered for this challenge")
        
        # Get challenge details
        challenge = await db.challenges.find_one({"id": challenge_id})
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")
        
        # Evaluate submission
        score, feedback = await self.evaluate_challenge_submission(submission_data, challenge)
        
        # Update team challenge
        updated_challenge = TeamChallenge(
            **team_challenge,
            status="completed",
            completion_time=datetime.utcnow(),
            score=score,
            submission_data=submission_data,
            feedback=feedback
        )
        
        await db.team_challenges.update_one(
            {"id": team_challenge["id"]},
            {"$set": updated_challenge.dict()}
        )
        
        # Update team points
        await self.update_team_points(team_id, int(score * 100))
        
        # Update user profiles
        team = await db.teams.find_one({"id": team_id})
        if team:
            for member_id in team["members"]:
                await self.update_user_challenge_completion(member_id, challenge_id, score)
        
        return updated_challenge
    
    async def evaluate_challenge_submission(self, submission_data: Dict[str, Any], challenge: Dict[str, Any]) -> tuple[float, str]:
        """Evaluate a team's challenge submission"""
        
        # This would integrate with code evaluation, peer review, etc.
        # For now, we'll use a simplified scoring system
        
        scoring_criteria = challenge.get("scoring_criteria", {})
        
        # Base score components
        completion_score = submission_data.get("completion_percentage", 0) * scoring_criteria.get("completion", 0.5)
        quality_score = submission_data.get("quality_score", 0.5) * scoring_criteria.get("quality", 0.3)
        teamwork_score = submission_data.get("teamwork_score", 0.5) * scoring_criteria.get("teamwork", 0.2)
        
        total_score = completion_score + quality_score + teamwork_score
        
        # Generate feedback
        feedback_prompt = f"""
        Generate feedback for this challenge submission:
        
        Challenge: {challenge.get("title", "Unknown")}
        Submission Data: {json.dumps(submission_data, indent=2)}
        Score: {total_score:.2f}
        
        Provide constructive feedback that:
        1. Acknowledges what went well
        2. Identifies areas for improvement
        3. Encourages continued learning
        4. Is specific and actionable
        5. Is appropriate for the team's skill level
        
        Return as a single feedback message.
        """
        
        try:
            feedback = await self.openai_service.generate_response(feedback_prompt)
            return total_score, feedback
        except Exception as e:
            return total_score, "Good work on the challenge! Keep practicing and improving your skills."
    
    async def get_user_gamification_profile(self, user_id: str) -> UserGamificationProfile:
        """Get or create user's gamification profile"""
        
        db = await get_database()
        
        profile = await db.user_gamification_profiles.find_one({"user_id": user_id})
        
        if not profile:
            # Get user's basic info
            user = await self.user_service.get_user_by_id(user_id)
            
            # Create new profile
            new_profile = UserGamificationProfile(
                user_id=user_id,
                username=user.username if user else "Anonymous",
                avatar_url=user.avatar_url if user else None,
                level=1,
                experience_points=0,
                total_points=0,
                current_team_id=None,
                teams_participated=[],
                challenges_completed=[],
                achievements=[],
                badges=[],
                ranking=0,
                skill_level=0.5,
                collaboration_score=0.0,
                leadership_score=0.0,
                mentorship_score=0.0,
                created_at=datetime.utcnow(),
                last_active=datetime.utcnow()
            )
            
            await db.user_gamification_profiles.insert_one(new_profile.dict())
            return new_profile
        
        return UserGamificationProfile(**profile)
    
    async def update_user_team_membership(self, user_id: str, team_id: str, role: TeamRole):
        """Update user's team membership"""
        
        db = await get_database()
        
        await db.user_gamification_profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {"current_team_id": team_id},
                "$addToSet": {"teams_participated": team_id},
                "$inc": {
                    "collaboration_score": 0.1 if role != TeamRole.LEADER else 0.2,
                    "leadership_score": 0.2 if role == TeamRole.LEADER else 0.0,
                    "mentorship_score": 0.1 if role == TeamRole.MENTOR else 0.0
                }
            }
        )
    
    async def update_user_challenge_completion(self, user_id: str, challenge_id: str, score: float):
        """Update user's challenge completion stats"""
        
        db = await get_database()
        
        # Calculate experience points
        experience_points = int(score * 50)
        
        # Get current profile
        profile = await self.get_user_gamification_profile(user_id)
        
        # Update profile
        await db.user_gamification_profiles.update_one(
            {"user_id": user_id},
            {
                "$addToSet": {"challenges_completed": challenge_id},
                "$inc": {
                    "experience_points": experience_points,
                    "total_points": int(score * 100)
                },
                "$set": {"last_active": datetime.utcnow()}
            }
        )
        
        # Check for level up
        await self.check_level_up(user_id)
    
    async def update_team_points(self, team_id: str, points: int):
        """Update team's total points"""
        
        db = await get_database()
        
        await db.teams.update_one(
            {"id": team_id},
            {"$inc": {"total_points": points}}
        )
    
    async def check_level_up(self, user_id: str):
        """Check if user has leveled up"""
        
        db = await get_database()
        
        profile = await self.get_user_gamification_profile(user_id)
        
        # Calculate required experience for next level
        required_exp = profile.level * 100
        
        if profile.experience_points >= required_exp:
            # Level up!
            new_level = profile.level + 1
            
            await db.user_gamification_profiles.update_one(
                {"user_id": user_id},
                {
                    "$set": {"level": new_level},
                    "$addToSet": {"achievements": f"Level {new_level}"}
                }
            )
            
            return True
        
        return False
    
    async def get_leaderboard(self, limit: int = 50, timeframe: str = "all_time") -> List[LeaderboardEntry]:
        """Get leaderboard rankings"""
        
        db = await get_database()
        
        # Build query based on timeframe
        query = {}
        if timeframe == "weekly":
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            query["last_active"] = {"$gte": cutoff_date}
        elif timeframe == "monthly":
            cutoff_date = datetime.utcnow() - timedelta(days=30)
            query["last_active"] = {"$gte": cutoff_date}
        
        # Get top users
        users = await db.user_gamification_profiles.find(query).sort("total_points", -1).limit(limit).to_list(length=None)
        
        # Create leaderboard entries
        leaderboard = []
        for rank, user in enumerate(users, 1):
            entry = LeaderboardEntry(
                user_id=user["user_id"],
                username=user["username"],
                avatar_url=user.get("avatar_url"),
                rank=rank,
                points=user["total_points"],
                level=user["level"],
                challenges_completed=len(user.get("challenges_completed", [])),
                team_contributions=len(user.get("teams_participated", [])),
                streak_days=0  # Would be calculated from activity
            )
            leaderboard.append(entry)
        
        return leaderboard
    
    async def get_team_leaderboard(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get team leaderboard rankings"""
        
        db = await get_database()
        
        teams = await db.teams.find({"is_active": True}).sort("total_points", -1).limit(limit).to_list(length=None)
        
        leaderboard = []
        for rank, team in enumerate(teams, 1):
            entry = {
                "team_id": team["id"],
                "team_name": team["name"],
                "avatar_url": team.get("avatar_url"),
                "rank": rank,
                "points": team["total_points"],
                "members_count": len(team["members"]),
                "skill_level": team["skill_level"],
                "achievements": team.get("achievements", [])
            }
            leaderboard.append(entry)
        
        return leaderboard
    
    async def get_active_challenges(self) -> List[Challenge]:
        """Get list of active challenges"""
        
        db = await get_database()
        
        challenges = await db.challenges.find({
            "is_active": True,
            "end_time": {"$gt": datetime.utcnow()}
        }).sort("start_time", -1).to_list(length=None)
        
        return [Challenge(**challenge) for challenge in challenges]
    
    async def get_user_teams(self, user_id: str) -> List[Team]:
        """Get teams that user belongs to"""
        
        db = await get_database()
        
        teams = await db.teams.find({
            "members": user_id,
            "is_active": True
        }).to_list(length=None)
        
        return [Team(**team) for team in teams]
    
    async def get_team_challenges(self, team_id: str) -> List[TeamChallenge]:
        """Get challenges that team has participated in"""
        
        db = await get_database()
        
        challenges = await db.team_challenges.find({
            "team_id": team_id
        }).sort("registration_time", -1).to_list(length=None)
        
        return [TeamChallenge(**challenge) for challenge in challenges]

# Initialize social gamification engine
gamification_engine = SocialGamificationEngine()

@router.post("/teams", response_model=Team)
async def create_team(team_name: str, description: str, leader_id: str, max_members: int = 5):
    """Create a new team"""
    try:
        team = await gamification_engine.create_team(team_name, description, leader_id, max_members)
        return team
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Team creation error: {str(e)}")

@router.post("/teams/{team_id}/join")
async def join_team(team_id: str, user_id: str, role: TeamRole = TeamRole.DEVELOPER):
    """Join a team"""
    try:
        success = await gamification_engine.join_team(user_id, team_id, role)
        return {"success": success}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Team join error: {str(e)}")

@router.get("/teams/user/{user_id}")
async def get_user_teams(user_id: str):
    """Get teams that user belongs to"""
    try:
        teams = await gamification_engine.get_user_teams(user_id)
        return {"teams": teams}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Team retrieval error: {str(e)}")

@router.post("/challenges", response_model=Challenge)
async def create_challenge(title: str, description: str, challenge_type: ChallengeType, 
                         difficulty: DifficultyLevel, duration_hours: int, max_teams: int = 10):
    """Create a new challenge"""
    try:
        challenge = await gamification_engine.create_challenge(title, description, challenge_type, difficulty, duration_hours, max_teams)
        return challenge
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Challenge creation error: {str(e)}")

@router.get("/challenges/active")
async def get_active_challenges():
    """Get list of active challenges"""
    try:
        challenges = await gamification_engine.get_active_challenges()
        return {"challenges": challenges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Challenge retrieval error: {str(e)}")

@router.post("/challenges/{challenge_id}/register")
async def register_team_for_challenge(challenge_id: str, team_id: str):
    """Register a team for a challenge"""
    try:
        team_challenge = await gamification_engine.register_team_for_challenge(team_id, challenge_id)
        return team_challenge
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

@router.post("/challenges/{challenge_id}/submit")
async def submit_challenge_solution(challenge_id: str, team_id: str, submission_data: Dict[str, Any]):
    """Submit team's solution for a challenge"""
    try:
        team_challenge = await gamification_engine.submit_challenge_solution(team_id, challenge_id, submission_data)
        return team_challenge
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission error: {str(e)}")

@router.get("/teams/{team_id}/challenges")
async def get_team_challenges(team_id: str):
    """Get challenges that team has participated in"""
    try:
        challenges = await gamification_engine.get_team_challenges(team_id)
        return {"challenges": challenges}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Team challenges retrieval error: {str(e)}")

@router.get("/profile/{user_id}")
async def get_user_gamification_profile(user_id: str):
    """Get user's gamification profile"""
    try:
        profile = await gamification_engine.get_user_gamification_profile(user_id)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Profile retrieval error: {str(e)}")

@router.get("/leaderboard")
async def get_leaderboard(limit: int = 50, timeframe: str = "all_time"):
    """Get leaderboard rankings"""
    try:
        leaderboard = await gamification_engine.get_leaderboard(limit, timeframe)
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Leaderboard retrieval error: {str(e)}")

@router.get("/leaderboard/teams")
async def get_team_leaderboard(limit: int = 20):
    """Get team leaderboard rankings"""
    try:
        leaderboard = await gamification_engine.get_team_leaderboard(limit)
        return {"leaderboard": leaderboard}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Team leaderboard retrieval error: {str(e)}")
