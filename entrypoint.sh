#!/bin/sh

# validate subscription status
API_URL="https://agent.api.stepsecurity.io/v1/github/$GITHUB_REPOSITORY/actions/subscription"

# Set a timeout for the curl command (3 seconds)
RESPONSE=$(curl --max-time 3 -s -w "%{http_code}" "$API_URL" -o /dev/null) || true
CURL_EXIT_CODE=${?}

# Check if the response code is not 200
if [ $CURL_EXIT_CODE -ne 0 ] || [ "$RESPONSE" != "200" ]; then
  if [ -z "$RESPONSE" ] || [ "$RESPONSE" == "000" ] || [ $CURL_EXIT_CODE -ne 0 ]; then
    echo "Timeout or API not reachable. Continuing to next step."
  else
    echo "Subscription is not valid. Reach out to support@stepsecurity.io"
    exit 1
  fi
fi

cd "${GITHUB_WORKSPACE}" || exit 1
git config --global --add safe.directory "${GITHUB_WORKSPACE}" || exit 1

export REVIEWDOG_GITHUB_API_TOKEN="${INPUT_GITHUB_TOKEN}"

# shellcheck disable=SC2086
markdownlint ${INPUT_MARKDOWNLINT_FLAGS:-.} 2>&1 \
  | reviewdog \
      -efm="%f:%l:%c %m" \
      -efm="%f:%l %m" \
      -name="markdownlint" \
      -reporter="${INPUT_REPORTER:-github-pr-check}" \
      -filter-mode="${INPUT_FILTER_MODE}" \
      -fail-level="${INPUT_FAIL_LEVEL}" \
      -fail-on-error="${INPUT_FAIL_ON_ERROR}" \
      -level="${INPUT_LEVEL}" \
      ${INPUT_REVIEWDOG_FLAGS} || EXIT_CODE=$?

 # github-pr-review only diff adding
if [ "${INPUT_REPORTER}" = "github-pr-review" ]; then
  # fix
  markdownlint --fix ${INPUT_MARKDOWNLINT_FLAGS:-.} 2>&1 || true

  TMPFILE=$(mktemp)
  git diff > "${TMPFILE}"

  git stash -u

  # shellcheck disable=SC2086
  reviewdog                        \
    -f=diff                        \
    -f.diff.strip=1                \
    -name="markdownlint-fix"       \
    -reporter="github-pr-review"   \
    -filter-mode="diff_context"    \
    -level="${INPUT_LEVEL}"        \
    ${INPUT_REVIEWDOG_FLAGS} < "${TMPFILE}"

  git stash drop || true
fi

exit ${EXIT_CODE}
