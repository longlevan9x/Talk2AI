import { EVENT_TYPE, EVENT_ACTION } from "../constant";

interface WindowEventData {
  type: EVENT_TYPE;
  action: EVENT_ACTION;
  payload?: any;
}