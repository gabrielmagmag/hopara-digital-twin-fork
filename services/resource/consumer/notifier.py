import json
import logging
import os

import requests

from common.process_resource_event import ResourceStepNotification

notification_endpoint = os.getenv('NOTIFICATION_ENDPOINT', 'http://localhost:8085')


class Notifier:
    def notify(self, notification: ResourceStepNotification) -> None:
        try:
            event = notification['event']
            notification_url = f"{notification_endpoint}/notify/{event}"
            headers = {
                'tenant': notification.get('tenant'),
            }
            payload = {
                'library': notification.get('library'),
                'id': notification.get('name'),
                'progress': notification.get('progress'),
            }
            response = requests.put(notification_url, headers=headers, json=payload)
            if response.status_code != 200:
                logging.error(
                    f'Failed to send notification, status code: {response.status_code}, response: {response.text}'
                )
            else:
                logging.info(
                    f"Notification sent: tenant: {notification.get('tenant')}, payload: {json.dumps(payload)}"
                )
        except requests.RequestException as e:
            logging.exception(f'Failed to send notification: {e}', exc_info=e)
