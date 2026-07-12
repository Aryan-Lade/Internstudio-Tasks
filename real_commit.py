import os
import subprocess
import sys
import time
from datetime import datetime


# -------------------------------
# Loading Animation
# -------------------------------
def loading_animation(duration=2):
    animation = "|/-\\"
    end_time = time.time() + duration
    i = 0
    sys.stdout.write("\nPreparing commit ")
    sys.stdout.flush()
    while time.time() < end_time:
        sys.stdout.write(animation[i % len(animation)])
        sys.stdout.flush()
        time.sleep(0.1)
        sys.stdout.write("\b")
        i += 1
    print("done")


# -------------------------------
# Check karna ki koi changes hain ya nahi
# -------------------------------
def has_changes():
    result = subprocess.run(
        ["git", "status", "--porcelain"],
        capture_output=True, text=True, check=True
    )
    return bool(result.stdout.strip())


# -------------------------------
# Real commit with custom backdate
# -------------------------------
def git_commit_backdated(message, commit_datetime):
    # Sab changed/added files ko stage karo
    subprocess.run(["git", "add", "."], check=True)

    date_str = commit_datetime.strftime("%Y-%m-%dT%H:%M:%S")

    env = os.environ.copy()
    env["GIT_AUTHOR_DATE"] = date_str
    env["GIT_COMMITTER_DATE"] = date_str

    subprocess.run(
        ["git", "commit", "-m", message, "--date", date_str],
        env=env,
        check=True
    )

    print(f"\n✔️ Commit ho gaya with date: {date_str}")


def git_push():
    subprocess.run(["git", "push"], check=True)


# -------------------------------
# User se Year / Month / Day / Time lena
# -------------------------------
def get_custom_datetime():
    print("\nBackdate ke liye date daalo 👇")
    year = int(input("👉 Year (e.g. 2024): "))
    month = int(input("👉 Month (1-12): "))
    day = int(input("👉 Day (1-31): "))

    time_choice = input("👉 Time customize karni hai? (y/n, default 12:00): ").strip().lower()
    if time_choice == "y":
        hour = int(input("   Hour (0-23): "))
        minute = int(input("   Minute (0-59): "))
    else:
        hour, minute = 12, 0

    return datetime(year, month, day, hour, minute, 0)


# -------------------------------
# Entry Point
# -------------------------------
if __name__ == "__main__":
    loading_animation(2)

    if not has_changes():
        print("\n⚠️ Koi changes detect nahi hue. Pehle apne files me code change karo, "
              "phir ye script run karo.")
        sys.exit(1)

    commit_message = input("\n📝 Commit message likho: ").strip()
    if not commit_message:
        commit_message = "Update project files"

    commit_dt = get_custom_datetime()

    confirm = input(
        f"\nCommit '{commit_message}' date '{commit_dt}' pe karna hai, confirm? (y/n): "
    ).strip().lower()

    if confirm != "y":
        print("Cancelled.")
        sys.exit(0)

    git_commit_backdated(commit_message, commit_dt)

    push_choice = input("\nPush bhi karna hai origin pe? (y/n): ").strip().lower()
    if push_choice == "y":
        git_push()
        print("\n🚀 Push ho gaya!")
    else:
        print("\nCommit local repo me ho gaya hai, push baad me kar lena: git push")