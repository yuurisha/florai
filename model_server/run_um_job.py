from jobs.um_scheduler import run_um_prediction_job
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | UM_JOB | %(message)s",
)

if __name__ == "__main__":
    logging.info("Starting UM prediction job.")
    logging.info(f"Job start time: {datetime.utcnow().isoformat()} UTC")
    run_um_prediction_job()
    logging.info("UM scheduled prediction job FINISHED")
    logging.info(f"Job end time: {datetime.utcnow().isoformat()} UTC")

