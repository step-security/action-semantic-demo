#!/bin/bash

set -eu

if "$INPUT_DISABLE_GLOBBING"; then
    set -o noglob;
fi

_set_github_output() {
    local name=${1}
    local value=${2}

    # Check if $GITHUB_OUTPUT is available
    # (Feature detection will be removed in spring 2023)
    if [ -z ${GITHUB_OUTPUT+x} ]; then
        echo "::set-output name=$name::$value";
    else
        echo "$name=$value" >> $GITHUB_OUTPUT;
    fi
}

_log() {
    local level=${1}
    local message=${2}

    echo "::$level::$message";
}

_main() {
    if "$INPUT_SKIP_FETCH"; then
        _log "warning" "git-auto-commit: skip_fetch has been removed in v6. It does not have any effect anymore.";
    fi

    if "$INPUT_SKIP_CHECKOUT"; then
        _log "warning" "git-auto-commit: skip_checkout has been removed in v6. It does not have any effect anymore.";
    fi

    if "$INPUT_CREATE_BRANCH"; then
        _log "warning" "git-auto-commit: create_branch has been removed in v6. It does not have any effect anymore.";
    fi

    _check_if_git_is_available

    _switch_to_repository

    _check_if_is_git_repository

    _check_if_repository_is_in_detached_state

    if "$INPUT_CREATE_GIT_TAG_ONLY"; then
        _log "debug" "Create git tag only";
        _set_github_output "create_git_tag_only" "true"
        _tag_commit
        _push_to_github
    elif _git_is_dirty || "$INPUT_SKIP_DIRTY_CHECK"; then

        _set_github_output "changes_detected" "true"

        _add_files

        # Check dirty state of repo again using git-diff.
        # (git-diff detects better if CRLF of files changes and does NOT
        # proceed, if only CRLF changes are detected. See #241 and #265
        # for more details.)
        if [ -n "$(git diff --staged)" ] || "$INPUT_SKIP_DIRTY_CHECK"; then
            _local_commit

            _tag_commit

            _push_to_github
        else
            _set_github_output "changes_detected" "false"

            echo "Working tree clean. Nothing to commit.";
        fi
    else
        _set_github_output "changes_detected" "false"

        echo "Working tree clean. Nothing to commit.";
    fi
}

_check_if_git_is_available() {
    if hash -- "$INPUT_INTERNAL_GIT_BINARY" 2> /dev/null; then
        _log "debug" "git binary found.";
    else
        _log "error" "git-auto-commit could not find git binary. Please make sure git is available."
        exit 1;
    fi
}

_switch_to_repository() {
    echo "INPUT_REPOSITORY value: $INPUT_REPOSITORY";
    cd "$INPUT_REPOSITORY";
}

_git_is_dirty() {
    echo "INPUT_STATUS_OPTIONS: ${INPUT_STATUS_OPTIONS}";
    _log "debug" "Apply status options ${INPUT_STATUS_OPTIONS}";

    echo "INPUT_FILE_PATTERN: ${INPUT_FILE_PATTERN}";
    read -r -a INPUT_FILE_PATTERN_EXPANDED <<< "$INPUT_FILE_PATTERN";

    # capture stderr
    gitStatusMessage="$((git status -s $INPUT_STATUS_OPTIONS -- ${INPUT_FILE_PATTERN_EXPANDED:+${INPUT_FILE_PATTERN_EXPANDED[@]}} >/dev/null ) 2>&1)";
    # shellcheck disable=SC2086
    gitStatus="$(git status -s $INPUT_STATUS_OPTIONS -- ${INPUT_FILE_PATTERN_EXPANDED:+${INPUT_FILE_PATTERN_EXPANDED[@]}})";
    [ -n "$gitStatus" ]
}

_check_if_is_git_repository() {
    if [ -d ".git" ]; then
        _log "debug" "Repository found.";
    else
        _log "error" "Not a git repository. Please make sure to run this action in a git repository. Adjust the `repository` input if necessary.";
        exit 1;
    fi
}

_check_if_repository_is_in_detached_state() {
    if [ -z "$(git symbolic-ref HEAD)" ]
    then
        _log "error" "Repository is in detached HEAD state. Please make sure you check out a branch. Adjust the `ref` input accordingly.";
        exit 1;
    else
        _log "debug" "Repository is on a branch.";
    fi
}

_add_files() {
    echo "INPUT_ADD_OPTIONS: ${INPUT_ADD_OPTIONS}";
    _log "debug" "Apply add options ${INPUT_ADD_OPTIONS}";

    echo "INPUT_FILE_PATTERN: ${INPUT_FILE_PATTERN}";
    read -r -a INPUT_FILE_PATTERN_EXPANDED <<< "$INPUT_FILE_PATTERN";

    # shellcheck disable=SC2086
    git add ${INPUT_ADD_OPTIONS} ${INPUT_FILE_PATTERN:+"${INPUT_FILE_PATTERN_EXPANDED[@]}"};
}

_local_commit() {
    echo "INPUT_COMMIT_OPTIONS: ${INPUT_COMMIT_OPTIONS}";
    _log "debug" "Apply commit options ${INPUT_COMMIT_OPTIONS}";

    # shellcheck disable=SC2206
    INPUT_COMMIT_OPTIONS_ARRAY=( $INPUT_COMMIT_OPTIONS );

    echo "INPUT_COMMIT_USER_NAME: ${INPUT_COMMIT_USER_NAME}";
    echo "INPUT_COMMIT_USER_EMAIL: ${INPUT_COMMIT_USER_EMAIL}";
    echo "INPUT_COMMIT_MESSAGE: ${INPUT_COMMIT_MESSAGE}";
    echo "INPUT_COMMIT_AUTHOR: ${INPUT_COMMIT_AUTHOR}";

    git -c user.name="$INPUT_COMMIT_USER_NAME" -c user.email="$INPUT_COMMIT_USER_EMAIL" \
        commit -m "$INPUT_COMMIT_MESSAGE" \
        --author="$INPUT_COMMIT_AUTHOR" \
        ${INPUT_COMMIT_OPTIONS:+"${INPUT_COMMIT_OPTIONS_ARRAY[@]}"};

    _set_github_output "commit_hash" $(git rev-parse HEAD)
}

_tag_commit() {
    echo "INPUT_TAGGING_MESSAGE: ${INPUT_TAGGING_MESSAGE}"

    if [ -n "$INPUT_TAGGING_MESSAGE" ]
    then
        _log "debug" "Create tag $INPUT_TAGGING_MESSAGE";
        git -c user.name="$INPUT_COMMIT_USER_NAME" -c user.email="$INPUT_COMMIT_USER_EMAIL" tag -a "$INPUT_TAGGING_MESSAGE" -m "$INPUT_TAGGING_MESSAGE";
    else
        echo "No tagging message supplied. No tag will be added.";
    fi
}

_push_to_github() {

    echo "INPUT_BRANCH value: $INPUT_BRANCH";

    echo "INPUT_PUSH_OPTIONS: ${INPUT_PUSH_OPTIONS}";
    _log "debug" "Apply push options ${INPUT_PUSH_OPTIONS}";

    # shellcheck disable=SC2206
    INPUT_PUSH_OPTIONS_ARRAY=( $INPUT_PUSH_OPTIONS );

    if [ -z "$INPUT_BRANCH" ]
    then
        # Only add `--tags` option, if `$INPUT_TAGGING_MESSAGE` is set
        if [ -n "$INPUT_TAGGING_MESSAGE" ]
        then
            _log "debug" "git push origin --tags";
            git push origin --follow-tags --atomic ${INPUT_PUSH_OPTIONS:+"${INPUT_PUSH_OPTIONS_ARRAY[@]}"};
        else
            _log "debug" "git push origin";
            git push origin ${INPUT_PUSH_OPTIONS:+"${INPUT_PUSH_OPTIONS_ARRAY[@]}"};
        fi

    else
        _log "debug" "Push commit to remote branch $INPUT_BRANCH";
        git push --set-upstream origin "HEAD:$INPUT_BRANCH" --follow-tags --atomic ${INPUT_PUSH_OPTIONS:+"${INPUT_PUSH_OPTIONS_ARRAY[@]}"};
    fi
}

_main
