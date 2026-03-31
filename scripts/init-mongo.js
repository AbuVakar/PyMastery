// MongoDB initialization script for PyMastery
// This script creates the application database and user

// Switch to application database
db = db.getSiblingDB('pymastery');

// Create application user with readWrite permissions
db.createUser({
  user: 'pymastery_user',
  pwd: 'pymastery_password',
  roles: [
    {
      role: 'readWrite',
      db: 'pymastery'
    }
  ]
});

// Create initial collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email"],
      properties: {
        name: {
          bsonType: "string",
          minLength: 2,
          maxLength: 100
        },
        email: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
        },
        role: {
          bsonType: "string",
          enum: ["student", "instructor", "admin"]
        },
        created_at: {
          bsonType: "date"
        }
      }
    }
  }
});

db.createCollection('courses', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "difficulty"],
      properties: {
        title: {
          bsonType: "string",
          minLength: 3,
          maxLength: 200
        },
        difficulty: {
          bsonType: "string",
          enum: ["beginner", "intermediate", "advanced"]
        },
        created_at: {
          bsonType: "date"
        }
      }
    }
  }
});

db.createCollection('problems', {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "difficulty", "test_cases"],
      properties: {
        title: {
          bsonType: "string",
          minLength: 3,
          maxLength: 200
        },
        difficulty: {
          bsonType: "string",
          enum: ["beginner", "intermediate", "advanced"]
        },
        test_cases: {
          bsonType: "array",
          minItems: 1
        },
        points: {
          bsonType: "int",
          minimum: 1
        },
        created_at: {
          bsonType: "date"
        }
      }
    }
  }
});

db.createCollection('submissions');
db.createCollection('enrollments');
db.createCollection('leaderboards');
db.createCollection('certificates');
db.createCollection('peer_review_requests');
db.createCollection('peer_reviews');
db.createCollection('export_requests');

// Create indexes for optimal performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role_track": 1 });
db.users.createIndex({ "created_at": 1 });
db.users.createIndex({ "login_streak": -1 });

db.courses.createIndex({ "title": 1 });
db.courses.createIndex({ "difficulty": 1 });
db.courses.createIndex({ "status": 1 });
db.courses.createIndex({ "created_at": -1 });

db.problems.createIndex({ "title": 1 });
db.problems.createIndex({ "difficulty": 1 });
db.problems.createIndex({ "points": -1 });
db.problems.createIndex({ "created_at": -1 });

db.submissions.createIndex({ "user_id": 1 });
db.submissions.createIndex({ "problem_id": 1 });
db.submissions.createIndex({ "overall_status": 1 });
db.submissions.createIndex({ "submitted_at": -1 });

db.enrollments.createIndex({ "user_id": 1, "course_id": 1 }, { unique: true });
db.enrollments.createIndex({ "user_id": 1 });
db.enrollments.createIndex({ "course_id": 1 });
db.enrollments.createIndex({ "status": 1 });

print('MongoDB initialization completed successfully!');
print('Database: pymastery');
print('User: pymastery_user');
print('Collections: 10');
print('Indexes: Created');
