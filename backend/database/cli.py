"""
Database Setup and Management Commands
CLI commands for database operations
"""

import asyncio
import click
import logging
from datetime import datetime
from database.mongodb import init_database, get_database, check_connection, close_database
from database.migrations import run_migrations, rollback_migrations, get_migration_status, reset_database

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@click.group()
def db():
    """Database management commands"""
    pass

@db.command()
@click.option('--force', is_flag=True, help='Force reset without confirmation')
def reset(force):
    """Reset entire database (for development/testing)"""
    if not force:
        if not click.confirm('Are you sure you want to reset the entire database? This will delete all data!'):
            click.echo('Database reset cancelled.')
            return
    
    try:
        asyncio.run(reset_database())
        click.echo('✅ Database reset successfully!')
    except Exception as e:
        click.echo(f'❌ Database reset failed: {e}')
        raise click.ClickException(str(e))

@db.command()
def migrate():
    """Run database migrations"""
    try:
        asyncio.run(run_migrations())
        click.echo('✅ All migrations completed successfully!')
    except Exception as e:
        click.echo(f'❌ Migration failed: {e}')
        raise click.ClickException(str(e))

@db.command()
@click.option('--version', help='Rollback to specific version')
def rollback(version):
    """Rollback database migrations"""
    try:
        asyncio.run(rollback_migrations(version))
        click.echo('✅ Rollback completed successfully!')
    except Exception as e:
        click.echo(f'❌ Rollback failed: {e}')
        raise click.ClickException(str(e))

@db.command()
def status():
    """Show migration status"""
    try:
        status = asyncio.run(get_migration_status())
        
        if 'error' in status:
            click.echo(f'❌ Failed to get status: {status["error"]}')
            return
        
        click.echo(f'📊 Migration Status:')
        click.echo(f'   Total migrations: {status["total_migrations"]}')
        click.echo(f'   Applied migrations: {status["applied_migrations"]}')
        click.echo(f'   Pending migrations: {len(status["pending_migrations"])}')
        
        if status["pending_migrations"]:
            click.echo(f'   Pending: {", ".join(status["pending_migrations"])}')
        
        click.echo(f'\n📋 Migration Details:')
        for migration in status["migration_details"]:
            status_icon = "✅" if migration["applied"] else "⏳"
            applied_at = f" (at {migration['applied_at']})" if migration["applied_at"] else ""
            click.echo(f'   {status_icon} {migration["version"]}: {migration["description"]}{applied_at}')
        
    except Exception as e:
        click.echo(f'❌ Failed to get status: {e}')
        raise click.ClickException(str(e))

@db.command()
def init():
    """Initialize database connection"""
    try:
        success = asyncio.run(init_database())
        if success:
            click.echo('✅ Database initialized successfully!')
        else:
            click.echo('❌ Database initialization failed!')
    except Exception as e:
        click.echo(f'❌ Database initialization failed: {e}')
        raise click.ClickException(str(e))

@db.command()
def check():
    """Check database connection"""
    try:
        is_connected, message = asyncio.run(check_connection())
        if is_connected:
            click.echo(f'✅ Database connection: {message}')
        else:
            click.echo(f'❌ Database connection: {message}')
    except Exception as e:
        click.echo(f'❌ Connection check failed: {e}')
        raise click.ClickException(str(e))

@db.command()
def stats():
    """Show database statistics"""
    try:
        async def get_stats():
            db = await get_database()
            
            # Get collection stats
            collections = await db.list_collection_names()
            total_documents = 0
            
            for collection_name in collections:
                collection = db[collection_name]
                count = await collection.count_documents({})
                total_documents += count
                click.echo(f'   {collection_name}: {count} documents')
            
            return len(collections), total_documents
        
        collections_count, total_documents = asyncio.run(get_stats())
        
        click.echo(f'📊 Database Statistics:')
        click.echo(f'   Collections: {collections_count}')
        click.echo(f'   Total documents: {total_documents}')
        
    except Exception as e:
        click.echo(f'❌ Failed to get statistics: {e}')
        raise click.ClickException(str(e))

@db.command()
@click.option('--collection', help='Show stats for specific collection')
def indexes(collection):
    """Show database indexes"""
    try:
        click.echo(f'📋 Index information feature temporarily disabled')
        click.echo(f'   Use MongoDB Compass or CLI directly to check indexes')
        
    except Exception as e:
        click.echo(f'❌ Failed to get indexes: {e}')
        raise click.ClickException(str(e))

@db.command()
@click.option('--collection', required=True, help='Collection name')
@click.option('--limit', type=int, default=10, help='Limit results')
@click.option('--query', help='MongoDB query to execute')
def query(collection, query, limit):
    """Execute MongoDB query"""
    try:
        click.echo(f'📋 Query feature temporarily disabled')
        click.echo(f'   Use MongoDB Compass or CLI directly to query collections')
        click.echo(f'   Collection: {collection}')
        click.echo(f'   Query: {query or "{}"}')
        click.echo(f'   Limit: {limit}')
        
    except Exception as e:
        click.echo(f'❌ Query failed: {e}')
        raise click.ClickException(str(e))

@db.command()
@click.option('--backup-path', default='./backup', help='Backup directory path')
def backup(backup_path):
    """Create database backup"""
    try:
        click.echo(f'💾 Backup feature temporarily disabled')
        click.echo(f'   Use MongoDB Compass or mongodump directly for backups')
        click.echo(f'   Backup path: {backup_path}')
        
    except Exception as e:
        click.echo(f'❌ Backup failed: {e}')
        raise click.ClickException(str(e))

@db.command()
@click.option('--backup-path', default='./backup', help='Backup directory path')
def restore(backup_path):
    """Restore database from backup"""
    try:
        click.echo(f'📥 Restore feature temporarily disabled')
        click.echo(f'   Use MongoDB Compass or mongorestore directly for restores')
        click.echo(f'   Backup path: {backup_path}')
        
    except Exception as e:
        click.echo(f'❌ Restore failed: {e}')
        raise click.ClickException(str(e))

@db.command()
@click.option('--collection', required=True, help='Collection name')
@click.confirmation_option(prompt='Are you sure you want to clear this collection?')
def clear(collection):
    """Clear all documents from a collection"""
    try:
        click.echo(f'🧹 Clear collection feature temporarily disabled')
        click.echo(f'   Use MongoDB Compass or CLI directly to clear collections')
        click.echo(f'   Collection: {collection}')
        
    except Exception as e:
        click.echo(f'❌ Clear failed: {e}')
        raise click.ClickException(str(e))

@db.command()
@click.option('--yes', is_flag=True, help='Skip confirmation')
def reset(yes):
    """Reset entire database"""
    try:
        click.echo(f'🗑️  Reset database feature temporarily disabled')
        click.echo(f'   Use MongoDB Compass or CLI directly to reset database')
        
    except Exception as e:
        click.echo(f'❌ Reset failed: {e}')
        raise click.ClickException(str(e))

@db.command()
@click.option('--days', type=int, default=30, help='Delete data older than N days')
@click.option('--dry-run', is_flag=True, help='Show what would be deleted without actually deleting')
def cleanup(days, dry_run):
    """Clean up old data"""
    try:
        click.echo(f'🧹 Cleanup feature temporarily disabled')
        click.echo(f'   Use MongoDB Compass or CLI directly to clean up data')
        click.echo(f'   Days: {days}')
        click.echo(f'   Dry run: {dry_run}')
        
    except Exception as e:
        click.echo(f'❌ Cleanup failed: {e}')
        raise click.ClickException(str(e))

if __name__ == '__main__':
    db()
